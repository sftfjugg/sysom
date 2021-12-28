from django.db import models

from lib import BaseModel, uuid_8
from apps.accounts.models import User
from apps.host.models import HostModel
from django.contrib.auth.models import AbstractUser


class JobModel(BaseModel):
    JOB_STATUS_CHOICES = (
        ('Ready', 'Ready'),
        ('Running', 'Running'),
        ('Success', 'Success'),
        ('Fail', 'Fail'),
    )
    instance_id = models.CharField(max_length=64, default=uuid_8, verbose_name="任务实例ID")
    status = models.CharField(max_length=32, choices=JOB_STATUS_CHOICES, default='Ready', verbose_name="任务状态")
    command = models.TextField(verbose_name="shell文本")
    job_result = models.TextField(default="", verbose_name="shell结果")
    src_instance = models.CharField(max_length=128, default="")
    dest_instance = models.CharField(max_length=128, default="")
    host_by = models.ForeignKey(to=HostModel, on_delete=models.CASCADE, related_name="host_jobs")
    created_by = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="user_jobs")

    def __str__(self):
        return f"Job: {self.instance_id}"

    class Meta:
        db_table = 'sys_job'
