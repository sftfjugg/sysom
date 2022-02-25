import logging
from rest_framework import serializers
from apps.alarm.models import AlarmModel
logger = logging.getLogger(__name__)


class AlarmSerializer(serializers.ModelSerializer):
    collected_time = serializers.DateTimeField(label=u'告警采集时间', format="%Y-%m-%d %H:%M:%S")
    level = serializers.SerializerMethodField(label='级别', read_only=True)
    class Meta:
        model = AlarmModel
        fields = "__all__"

    def get_level(self, obj):
        return obj.get_level_display()

