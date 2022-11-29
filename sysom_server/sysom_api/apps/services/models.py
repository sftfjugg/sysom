from django.db import models
from lib.utils import human_datetime


class ServiceInfo(models.Model):
    service_name = models.CharField(max_length=100, unique=True)
    created_at = models.CharField(max_length=20, default=human_datetime, verbose_name="创建时间")

    class Meta:
        db_table = "sys_service_info"
    
    def __str__(self):
        return f'服务：{self.service_name}'