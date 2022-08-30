from django.db import models
from lib import BaseModel


class SettingsModel(BaseModel):
    key = models.CharField(max_length=128, unique=True)
    value = models.TextField()
    description = models.TextField(default='', verbose_name='描述')

    def __str__(self) -> str:
        return self.key

    class Meta:
        db_table = 'sys_settings'


class ExecuteResult(BaseModel):
    invoke_id = models.CharField(max_length=64, verbose_name='任务ID')
    result = models.JSONField(verbose_name='执行结果')
    channel_name = models.CharField(max_length=32, verbose_name='执行通道', default='')

    def __str__(self) -> str:
        return self.invoke_id

    class Meta:
        db_table = 'sys_execute_result'
