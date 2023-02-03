from django.db import models

from lib.base_model import BaseModel


class JobModel(BaseModel):
    JOB_STATUS_CHOICES = (
        ('Ready', 'Ready'),
        ('Running', 'Running'),
        ('Success', 'Success'),
        ('Fail', 'Fail'),
    )
    task_id = models.CharField(max_length=64, default="", verbose_name="任务实例ID")
    status = models.CharField(max_length=32, choices=JOB_STATUS_CHOICES, default='Ready', verbose_name="任务状态")
    service_name = models.CharField(max_length=128, verbose_name="")
    command = models.TextField(verbose_name="shell文本")
    code = models.IntegerField(verbose_name="诊断执行状态码", default=0)
    err_msg = models.TextField(verbose_name="诊断错误信息", default="")
    result = models.TextField(verbose_name="shell结果")
    params = models.TextField(verbose_name="params")
    host_by = models.TextField(max_length=64, default="", verbose_name="host_jobs")
    created_by = models.IntegerField(verbose_name='创建人')

    def __str__(self):
        return f"Job: {self.task_id}"

    class Meta:
        db_table = 'sys_job'
