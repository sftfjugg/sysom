from django.db import models
from lib import BaseModel
from django.contrib.auth import get_user_model
from apps.host.models import HostModel

User = get_user_model()


class NotcelconTypeChoices(models.IntegerChoices):
    notification = 0, 'notification'
    warning = 1, 'warning'


class AlarmModel(BaseModel):
    LEVEL_CHOICES = (
        (0, 'info'),
        (1, 'warning'),
        (2, 'error'),
        (3, 'success')
    )

    noticelcon_type = models.SmallIntegerField(default=NotcelconTypeChoices.notification, choices=NotcelconTypeChoices.choices, verbose_name='通知类型')
    receiver = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="alarm_user", verbose_name="告警接受者", null=True, blank=True)
    host = models.ForeignKey(HostModel, on_delete=models.SET_NULL, related_name="alarm_hosts", verbose_name="告警主机", null=True, blank=True)
    level = models.IntegerField(choices=LEVEL_CHOICES, default=0, verbose_name="告警级别")
    message = models.TextField(verbose_name="告警内容")
    collected_time = models.DateTimeField(verbose_name="告警采集时间")
    duration_time = models.TimeField(null=True, blank=True, verbose_name="告警持续时间")
    item = models.CharField(max_length=100, verbose_name="告警项")
    is_read = models.BooleanField(default=False, verbose_name="是否已读")
    sub = models.ForeignKey(to='SubscribeModel', related_name='alarms', on_delete=models.CASCADE)

    class Meta:
        db_table = "sys_alarm"


class SubscribeModel(BaseModel):
    """订阅主题表"""
    title = models.CharField(max_length=128, unique=True, verbose_name='订阅名称')
    users = models.ManyToManyField(to=User, related_name='subs')

    class Meta:
        db_table = "sys_subscribe"