from django.db import models
from lib.base_model import BaseModel


class MigImpModel(BaseModel):

    cluster_id = models.IntegerField(verbose_name='cluster id')
    hostname = models.CharField(max_length=100, verbose_name='hostname')
    ip = models.CharField(max_length=100, unique=True, verbose_name='ip')
    version = models.CharField(max_length=100, verbose_name='系统版本')
    status = models.CharField(max_length=32, default='waiting', verbose_name='迁移实施状态')
    rate = models.IntegerField(default=0, verbose_name='迁移实施进度')

    class Meta:
        db_table = 'mig_implementation'


class MigImpInfoModel(BaseModel):

    ip = models.CharField(max_length=100, unique=True, verbose_name='ip')
    mig_info = models.TextField(verbose_name='迁移配置')
    old_info = models.TextField(verbose_name='迁移前信息')
    new_info = models.TextField(verbose_name='迁移后信息')
    cmp_info = models.TextField(verbose_name='迁移对比')
    log = models.TextField(verbose_name='实施日志')
    report = models.TextField(verbose_name='实施报告')

    class Meta:
        db_table = 'mig_implementation_info'


class MigJobModel(BaseModel):

    ip = models.CharField(max_length=100, verbose_name='ip')
    mig_id = models.CharField(max_length=32, verbose_name='任务ID')
    mig_type = models.CharField(max_length=32, verbose_name='任务类型')
    job_name = models.CharField(max_length=32, verbose_name='名称')
    job_data = models.TextField(verbose_name='参数')
    job_status = models.CharField(max_length=32, default='running', verbose_name='状态')
    job_result = models.TextField(verbose_name='结果')

    class Meta:
        db_table = 'mig_job'
