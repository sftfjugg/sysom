import logging
from django.http.response import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import mixins

from django.conf import settings
from apps.task import seriaizer
from apps.task.models import JobModel
from apps.task.filter import TaskFilter
from apps.common.common_model_viewset import CommonModelViewSet
from lib.response import success, other_response, not_found
from lib.authentications import TaskAuthentication
from .executors import TaskDispatcher

logger = logging.getLogger(__name__)
IS_MICRO_SERVICES = settings.IS_MICRO_SERVICES


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
    authentication_classes = [TaskAuthentication]
    create_requird_fields = ['service_name']

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        # 构造任务执行器，并使用它来进行任务下发和结果处理（结果处理在 apps.py）
        # 【v2 基于事件中心接口相关功能】
        self._task_executor: TaskDispatcher = TaskDispatcher(settings.SYSOM_CEC_URL)

    def get_authenticators(self):
        if self.request.path.endswith("svg/"):
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def create(self, request, *args, **kwargs):
        return self.create_task_v2(request, *args, **kwargs)

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

    def create_task_v2(self, request, *args, **kwargs):
        try:
            # 检查参数是否缺失
            res = self.require_param_validate(
                request, ['service_name'])
            if not res['success']:
                return other_response(message=res.get('message', 'Missing parameters'), code=400)
            data = request.data
            data['user'] = getattr(request, 'user')
            return self._delivery_task(data)
        except Exception as e:
            logger.error(e, exc_info=True)
            return other_response(message=str(e), code=400, success=False)

    def _delivery_task(self, data: dict):
        """
        将任务发布到事件中心
        【v2 基于事件中心接口相关功能】
        """
        res = self._task_executor.delivery_task(data)
        if res['success']:
            return success(result=res["result"])