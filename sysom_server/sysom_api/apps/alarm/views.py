from loguru import logger
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins
from django.db.models import Q

from apps.alarm import serializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.alarm.models import AlarmModel, SubscribeModel
from lib.response import success, other_response, not_found
from django.conf import settings
from cec_base.producer import Producer, dispatch_producer
from cec_base.admin import Admin, dispatch_admin


producer: Producer = dispatch_producer(settings.SYSOM_CEC_URL)
admin: Admin = dispatch_admin(settings.SYSOM_CEC_URL)

# 存储当前模块全局状态
storage = {
    'alarm_topic_exist': False
}

def _create_alarm_message(kwargs):
    alarm_serializer = serializer.AddAlarmSerializer(data=kwargs)
    alarm_serializer.is_valid(raise_exception=True)
    alarm_serializer.save()
    subscriber = alarm_serializer.instance.sub.title
    ser = serializer.AlarmSerializer(alarm_serializer.instance)
    if not storage['alarm_topic_exist']:
        storage['alarm_topic_exist'] = admin.is_topic_exist(
            settings.SYSOM_CEC_ALARM_TOPIC) or admin.create_topic(settings.SYSOM_CEC_ALARM_TOPIC)
    producer.produce(settings.SYSOM_CEC_ALARM_TOPIC, {
        "sub": subscriber,
        "message": ser.data
    })
    producer.flush()
    return alarm_serializer.data


class AlarmAPIView(GenericViewSet,
                   mixins.ListModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.CreateModelMixin,
                   mixins.UpdateModelMixin
                   ):
    queryset = AlarmModel.objects.filter(
        Q(deleted_at__isnull=True) | Q(deleted_at='')).order_by("-created_at")
    serializer_class = serializer.AlarmSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    search_fields = ('id', 'host__id', 'receiver__id',
                     'level', 'noticelcon_type')  # 模糊查询
    filter_fields = ('id', 'host__id', 'receiver__id',
                     'level', 'noticelcon_type')  # 精确查询

    def create(self, request, *args, **kwargs):
        response = _create_alarm_message(request.data)
        return success(result=response, message="插入成功")

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

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return success(result=response.data, message="修改成功")

    def get_user_alarm(self, request):
        sub_ids = request.user.subs.all()
        alarms = [sub_id.alarms.filter(is_read=False) for sub_id in sub_ids]
        items = []
        for alarm in alarms:
            serializer = self.get_serializer(alarm, many=True)
            items += serializer.data
        return success(result=items)


class SubAPIView(GenericViewSet,
                 mixins.ListModelMixin,
                 mixins.RetrieveModelMixin,
                 mixins.CreateModelMixin,
                 mixins.DestroyModelMixin,
                 mixins.UpdateModelMixin
                 ):
    queryset = SubscribeModel.objects.filter(
        Q(deleted_at__isnull=True) | Q(deleted_at=''))
    serializer_class = serializer.SubSerializer
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)

    def create(self, request, *args, **kwargs):
        try:
            title = request.data.get("title")
            sub = SubscribeModel.objects.filter(title=title).first()
            if sub:
                sub.users.add(request.user)
            else:
                request.data["users"] = [request.user.id]
                super().create(request, *args, **kwargs)
            return success(result=[], message="订阅成功")
        except Exception as e:
            logger.error(e)
            return other_response(message=str(e), code=400, success=False)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_queryset().filter(**kwargs).first()
            if not instance:
                return not_found()
            instance.users.remove(request.user)
            return success(message="取消成功", code=200, result={})
        except Exception as e:
            logger.error(e)
            return other_response(message=str(e), code=400, success=False)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return success([], total=0)
        return super(SubAPIView, self).list(request, *args, **kwargs)
