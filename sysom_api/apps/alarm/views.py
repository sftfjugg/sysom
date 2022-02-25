from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins
from django.db.models import Q

from apps.alarm import serializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.alarm.models import AlarmModel
from lib import *

logger = logging.getLogger(__name__)


class AlarmAPIView(GenericViewSet,
                   mixins.ListModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.CreateModelMixin
                   ):
    queryset = AlarmModel.objects.filter(Q(deleted_at__isnull=True) | Q(deleted_at=''))
    serializer_class = serializer.AlarmSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    search_fields = ('id', 'host__id', 'receiver__id', 'level')  # 模糊查询
    filter_fields = ('id', 'host__id', 'receiver__id', 'level')  # 精确查询
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return success(result=response.data, message="插入成功")
        except Exception as e:
            logger.error(e)
            return other_response(message=str(e), code=400, success=False)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return success([])
        serializer = self.get_serializer(instance)
        return success(result=serializer.data)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return success([], total=0)
        return super(AlarmAPIView, self).list(request, *args, **kwargs)
