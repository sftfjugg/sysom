from loguru import logger
from django.http.response import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import mixins
from django.http.response import Http404
from django.conf import settings
from apps.task import seriaizer
from apps.task.models import JobModel
from apps.task.filter import TaskFilter
from lib.base_view import CommonModelViewSet
from lib.response import success, not_found, ErrorResponse, other_response
from lib.authentications import TokenAuthentication
from channel_job.job import JobResult
from .helper import DiagnosisHelper


class TaskAPIView(CommonModelViewSet,
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
    authentication_classes = [TokenAuthentication]
    create_requird_fields = ['service_name']
    lookup_field = 'task_id'

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)

    def get_authenticators(self):
        # 判断请求是否是单查task
        task_id = self.kwargs.get(self.lookup_field, None)
        if self.request.path.endswith("svg/") or (task_id is not None and self.request.method == 'GET'):
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def create(self, request, *args, **kwargs):
        return self.create_task_v2(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except Http404:
            return other_response(result={}, message='task不存在', success=False, code=400)

        response = seriaizer.JobRetrieveSerializer(instance)
        res = response.data
        result = res['result']
        if 'state' in result:
            res['result'] = result['result']
        res['url'] = "/".join(["", "diagnose", "detail", instance.task_id])
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

    def create_task_v2(self, request, *args, **kwargs):
        try:
            # 1. Check required params
            res = self.require_param_validate(
                request, ['service_name'])
            if not res['success']:
                return ErrorResponse(msg=res.get('message', 'Missing parameters'))
            data = request.data

            # 3. Create Task
            instance = DiagnosisHelper.init(data, getattr(request, 'user'))
            self.produce_event_to_cec(
                settings.SYSOM_CEC_DIAGNOSIS_TASK_DISPATCH_TOPIC,
                {
                    "task_id": instance.task_id
                }
            )
            return success({
                "task_id": instance.task_id
            })
        except Exception as e:
            logger.exception(e)
            return ErrorResponse(msg=str(e))

    def offline_import(self, request, *args, **kwargs):
        """Offline import of diagnostic logs"""
        try:
            # 1. Check required params
            res = self.require_param_validate(
                request, ['instance', 'offline_log', 'service_name'])
            if not res['success']:
                return ErrorResponse(message=res.get('message', 'Missing parameters'))
            data = request.data

            # 2. Offline import
            offline_log = data.pop("offline_log", "")
            instance = DiagnosisHelper.offline_import(
                data, getattr(request, 'user'))

            # 3. postprocess
            DiagnosisHelper.postprocess(
                instance, job_result=JobResult(code=0, result=offline_log))
            return success({
                "task_id": instance.task_id
            })
        except Exception as e:
            logger.exception(e)
            return ErrorResponse(msg=str(e))
