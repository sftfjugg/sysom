import os
import ast
import subprocess

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
from apps.host.models import HostModel
from apps.accounts.models import User
from apps.task.filter import TaskFilter
from consumer.executors import SshJob
from lib import *



class JobAPIView(GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    queryset = JobModel.objects.all()
    serializer_class = seriaizer.JobListSerializer
    authentication_classes = []

    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.filter(created_by=self.request.user)
        queryset = queryset.filter(deleted_at=None)
        return queryset

    def get_object(self):
        pass

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return success(result=response.data)


class TaskAPIView(GenericViewSet,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.DestroyModelMixin,
                  mixins.CreateModelMixin
                  ):
    queryset = JobModel.objects.filter(Q(deleted_at__isnull=True) | Q(deleted_at=''))
    serializer_class = seriaizer.JobListSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter, TaskFilter)
    search_fields = ('id', 'task_id', 'created_by__id', 'status', 'params')  # 模糊查询
    filter_fields = ('id', 'task_id', 'created_by__id', 'status')  # 精确查询
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            return script_task(data)
        except Exception as e:
            logger.error(e, exc_info=True)
            return other_response(message=str(e), code=400, success=False)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return success([])
        response = seriaizer.JobRetrieveSerializer(instance)
        return success(result=response.data)

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

    def perform_destroy(self, instance: JobModel):
        instance.deleted_at = human_datetime()
        instance.deleted_by = self.request.user
        instance.save()

    def get_task_svg(self, request, task_id: str, etx: str, *args, **kwargs):
        if etx != 'svg':
            return not_found(message="请输入正确参数: SVG")

        instance = get_object_or_404(JobModel, pk=task_id)
        if instance.status == 'Success':
            result = json.loads(instance.result)
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
        user = User.objects.filter(username=username).first()
        if service_name:
            SCRIPTS_DIR = settings.SCRIPTS_DIR
            service_path = os.path.join(SCRIPTS_DIR, service_name)
            if not os.path.exists(service_path):
                logger.error("can not find script file, please check service name")
                return other_response(message="can not find script file, please check service name", code=400,
                                      success=False)
            try:
                resp = subprocess.run([service_path, json.dumps(data)], stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE)
            except Exception as e:
                JobModel.objects.create(command='', task_id=task_id,
                                        created_by=user, result=str(e), status="Fail")
                logger.error(e, exc_info=True)
                return other_response(message=str(e), code=400, success=False)
            if resp.returncode != 0:
                logger.error(str(resp.stderr.decode('utf-8')))
                JobModel.objects.create(command='', task_id=task_id,
                                        created_by=user, result=resp.stderr.decode('utf-8'), status="Fail")
                return other_response(message=str(resp.stderr.decode('utf-8')), code=400, success=False)
            stdout = resp.stdout
            stdout = stdout.decode('utf-8')
            resp = ast.literal_eval(stdout)
            resp_scripts = resp.get("commands")
            if not resp_scripts:
                logger.error("not find commands, Please check the script return")
                JobModel.objects.create(command='', task_id=task_id,
                                        created_by=user, result="not find commands, Please check the script return",
                                        status="Fail")
                return other_response(message="not find commands, Please check the script return", code=400,
                                      success=False)
            ssh_job(resp_scripts, task_id, user, json.dumps(params), update_host_status=update_host_status,
                    service_name=service_name)
            return success(result={"instance_id": task_id})
        else:
            return default_ssh_job(data, task_id)
    except Exception as e:
        logger.error(e, exc_info=True)
        return other_response(message=str(e), code=400, success=False)


def default_ssh_job(data, task_id):
    try:
        host_ids = data.get("host_ids")
        commands = data.get("commands")
        if not host_ids:
            return other_response(message="请选择执行主机", code=400)
        user = User.objects.filter(username='admin').first()
        cmds = []
        for i in range(len(host_ids)):
            instance = {}
            host = HostModel.objects.filter(pk=host_ids[i]).first()
            instance["instance"] = host.ip
            instance["cmd"] = commands[i]
            cmds.append(instance)
        ssh_job(cmds, task_id, user)
        return success(result={"instance_id": task_id})
    except Exception as e:
        logger.error(e, exc_info=True)
        return other_response(message=str(e), code=400, success=False)


def ssh_job(resp_scripts, task_id, user, data=None, **kwargs):
    if not data:
        job_model = JobModel.objects.create(command=resp_scripts, task_id=task_id,
                                            created_by=user)
    else:
        job_model = JobModel.objects.create(command=resp_scripts, task_id=task_id,
                                            created_by=user, params=data)
    sch_job = SshJob(resp_scripts, job_model, **kwargs)
    scheduler.add_job(sch_job.run)
