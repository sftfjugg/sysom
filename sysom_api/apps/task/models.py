from django.db import models

from lib import BaseModel
from apps.accounts.models import User
from apps.host.models import HostModel


class JobModel(BaseModel):
    JOB_STATUS_CHOICES = (
        ('Ready', 'Ready'),
        ('Running', 'Running'),
        ('Success', 'Success'),
        ('Fail', 'Fail'),
    )
    task_id = models.CharField(max_length=64, default="", verbose_name="任务实例ID")
    status = models.CharField(max_length=32, choices=JOB_STATUS_CHOICES, default='Ready', verbose_name="任务状态")
    command = models.TextField(verbose_name="shell文本")
    job_result = models.TextField(default="", verbose_name="shell结果")
    host_by = models.TextField(max_length=64, default="", verbose_name="host_jobs")
    created_by = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="user_jobs")

    def __str__(self):
        return f"Job: {self.task_id}"

    class Meta:
        db_table = 'sys_job'


class ServiceModel(BaseModel):
    service_name = models.CharField(max_length=64, verbose_name="service名称")
    service_script = models.CharField(max_length=64, verbose_name="脚本名称")

    class Meta:
        db_table = 'service'