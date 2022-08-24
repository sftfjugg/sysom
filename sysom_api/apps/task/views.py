import json
import os
import ast
import subprocess
import logging
import platform
from django.http.response import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins
from django.db.models import Q

from django.conf import settings
from apps.task import seriaizer
from apps.task.models import JobModel
from apps.task.filter import TaskFilter
from lib.response import success, other_response, not_found
from lib.utils import uuid_8, scheduler
from lib.exception import APIException
from lib.authentications import TaskAuthentication

logger = logging.getLogger(__name__)
IS_MICRO_SERVICES = settings.IS_MICRO_SERVICES


class TaskAPIView(GenericViewSet,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.DestroyModelMixin,
                  mixins.CreateModelMixin
                  ):
    queryset = JobModel.objects.all()
    serializer_class = seriaizer.JobListSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    search_fields = ('id', 'task_id', 'created_by__id',
                     'status', 'params')  # 模糊查询
    filterset_class = TaskFilter  # 精确查询
    authentication_classes = [TaskAuthentication]
    create_requird_fields = ['instance', 'service_name']

    def get_authenticators(self):
        if self.request.path.endswith("svg/"):
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            for item in filter(lambda x: not x[1], [(field, data.get(field)) for field in self.create_requird_fields]):
                return other_response(message=f'Field: {item[0]} is required!', code=400)
            if IS_MICRO_SERVICES:
                data['user'] = getattr(request, 'user')
            return script_task(data)
        except Exception as e:
            logger.error(e, exc_info=True)
            return other_response(message=str(e), code=400, success=False)

    def retrieve(self, request, *args, **kwargs):
        kwargs["task_id"] = kwargs.pop("pk")
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return success([])
        response = seriaizer.JobRetrieveSerializer(instance)
        res = response.data
        result = res['result']
        if 'state' in result:
            res['result'] = result['result']
        return success(result=res)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return success([], total=0)
        return super(TaskAPIView, self).list(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return not_found()
        self.perform_destroy(instance)
        return success(message="删除成功", code=200, result={})

    def get_task_svg(self, request, task_id: str, etx: str, *args, **kwargs):
        if etx != 'svg':
            return not_found(message="请输入正确参数: SVG")

        instance = get_object_or_404(JobModel, task_id=task_id)
        if instance.status == 'Success':
            result = instance.result
            svg_context = result.get('flamegraph', None)
            if svg_context is None:
                return success(success=False, message='Result 未包含 "flamegraph"字段')
            return FileResponse(svg_context)
        else:
            return success(result={}, message=f"任务：{instance.status}", success=False)


def script_task(data):
    try:
        params = data.copy()
        service_name = data.pop("service_name", None)
        update_host_status = data.pop("update_host_status", False)
        task_id = uuid_8()
        username = data['username'] if data.get('username') else "admin"

        if IS_MICRO_SERVICES:
            data.pop('user')
            user = params.pop('user')
            user_id = user['user_id']
        else:
            from apps.accounts.models import User
            user = User.objects.filter(username=username).first()
            user_id = user.pk

        task = JobModel.objects.filter(status__in=["Running"], params=params)
        if task:
            return other_response(
                message=f"node:{params['instance']}, There are tasks in progress, {params['service_name']}",
                code=400,
                success=False
            )

        SCRIPTS_DIR = settings.SCRIPTS_DIR
        service_path = os.path.join(SCRIPTS_DIR, service_name)
        if not os.path.exists(service_path):
            logger.error("can not find script file, please check service name")
            return other_response(message="can not find script file, please check service name", code=400,
                                  success=False)
        try:
            command_list = ['python', service_path, json.dumps(data)] if platform.system() == "Windows" else [service_path, json.dumps(data)]
            resp = subprocess.run(command_list, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE)
        except Exception as e:
            JobModel.objects.create(command='', task_id=task_id,
                                    created_by=user_id, result=str(e), status="Fail")
            logger.error(e, exc_info=True)
            return other_response(message=str(e), code=400, success=False)
        if resp.returncode != 0:
            logger.error(str(resp.stderr.decode('utf-8')))
            JobModel.objects.create(command='', task_id=task_id,
                                    created_by=user_id, result=resp.stderr.decode('utf-8'), status="Fail")
            return other_response(message=str(resp.stderr.decode('utf-8')), code=400, success=False)
        stdout = resp.stdout
        stdout = stdout.decode('utf-8')
        resp = ast.literal_eval(stdout)
        resp_scripts = resp.get("commands")
        if not resp_scripts:
            logger.error("not find commands, Please check the script return")
            JobModel.objects.create(command='', task_id=task_id,
                                    created_by=user_id, result="not find commands, Please check the script return",
                                    status="Fail")
            return other_response(message="not find commands, Please check the script return", code=400,
                                  success=False)
        ssh_job(
            resp_scripts,
            task_id,
            user_id,
            params,
            update_host_status=update_host_status,
            service_name=service_name,
            user=user
        )
        return success(result={"instance_id": task_id})
    except Exception as e:
        logger.error(e, exc_info=True)
        return other_response(message=str(e), code=400, success=False)


def ssh_job(resp_scripts, task_id: str, user_id: int, data=None, **kwargs):
    """
    创建任务, 并下发到调度器开始执行
    """
    create_args = dict()
    create_args['command'] = resp_scripts
    create_args['task_id'] = task_id
    create_args['created_by'] = user_id

    if data:
        create_args['params'] = data
    try:
        JobModel.objects.create(**create_args)
    except:
        raise APIException(message='任务创建失败!')

    from .executors import SshJob
    sch_job = SshJob(resp_scripts, task_id, **kwargs)
    scheduler.add_job(sch_job.run)
