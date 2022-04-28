import logging
from rest_framework import serializers
from apps.alarm.models import AlarmModel, SubscribeModel
logger = logging.getLogger(__name__)


class AlarmSerializer(serializers.ModelSerializer):
    collected_time = serializers.DateTimeField(label=u'告警采集时间', format="%Y-%m-%d %H:%M:%S")
    level = serializers.SerializerMethodField(label='级别', read_only=True)
    noticelcon_type = serializers.SerializerMethodField(label='通知类型')

    class Meta:
        model = AlarmModel
        fields = "__all__"

    def get_level(self, obj):
        return obj.get_level_display()

    def get_noticelcon_type(self, obj):
        return obj.get_noticelcon_type_display()


class AddAlarmSerializer(serializers.ModelSerializer):

    class Meta:
        model = AlarmModel
        fields = '__all__'

class SubSerializer(serializers.ModelSerializer):

    class Meta:
        model = SubscribeModel
        fields = "__all__"