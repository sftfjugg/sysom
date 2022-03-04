from django.db import models
from lib import BaseModel
from apps.accounts.models import User
from apps.host.models import HostModel


class AlarmModel(BaseModel):
    LEVEL_CHOICES = (
        (0, 'info'),
        (1, 'warning'),
        (2, 'error')
    )
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="alarm_user", verbose_name="告警接受者")
    host = models.ForeignKey(HostModel, on_delete=models.CASCADE, related_name="alarm_hosts", verbose_name="告警主机")
    level = models.IntegerField(choices=LEVEL_CHOICES, default=0, verbose_name="告警级别")
    message = models.TextField(verbose_name="告警内容")
    collected_time = models.DateTimeField(verbose_name="告警采集时间")
    duration_time = models.TimeField(null=True, blank=True, verbose_name="告警持续时间")
    item = models.CharField(max_length=100, verbose_name="告警项")

    class Meta:
        db_table = "alarm"
