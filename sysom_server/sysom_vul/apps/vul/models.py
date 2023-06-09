import json
from loguru import logger
from django.db import models
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _
from lib.base_model import BaseModel, human_datetime
from apps.host.models import HostModel
# from apps.accounts.models import User


# Create your models here.

class VulAddrModel(models.Model):
    """
    custom vul db config
    """
    REQUEST_METHOD_CHOICES = (
        (0, 'GET'),
        (1, 'POST'),
    )
    STATUS_CHOICES = (
        (0, _("up")),
        (1, _("down")),
        (2, _("uninit")),
    )

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(default="")
    method = models.SmallIntegerField(choices=REQUEST_METHOD_CHOICES, default=0, verbose_name="request method")
    url = models.URLField()
    headers = models.TextField(verbose_name="请求头", default=json.dumps({}))
    params = models.TextField(verbose_name="请求路径参数", default=json.dumps({}))
    body = models.TextField(verbose_name="请求体", default=json.dumps({}))
    authorization_type = models.CharField(max_length=30, blank=True)
    authorization_body = models.TextField(verbose_name="请求认证体", default=json.dumps({}))
    parser = models.TextField(verbose_name="parse vul data structure", default=json.dumps({}))
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=2, verbose_name="vul database status")
    is_edited = models.BooleanField(verbose_name="Is the vulnerability database editable", default=True)

    class Meta:
        db_table = "sys_vul_db"

    def __str__(self):
        return f'vul addres: {self.url}'


class VulBaseModel(BaseModel):
    cve_id = models.CharField(max_length=100)
    score = models.CharField(max_length=20, verbose_name="cve score")
    description = models.TextField(default="")
    pub_time = models.CharField(max_length=100, verbose_name="publish time")
    vul_level = models.CharField(max_length=100, blank=True)
    detail = models.TextField(default="")
    software_name = models.CharField(max_length=100)
    fixed_time = models.CharField(max_length=100)
    fixed_version = models.CharField(max_length=100)
    os = models.CharField(max_length=100)
    update_time = models.DateTimeField(verbose_name="", blank=True, null=True)

    class Meta:
        abstract = True


class VulModel(VulBaseModel):
    status = models.CharField(max_length=100)
    host = models.ManyToManyField(to=HostModel, verbose_name='关联主机', db_constraint=False)

    class Meta:
        db_table = "sys_vul"
        unique_together = [['cve_id', 'software_name', 'fixed_version', 'os']]

    def __str__(self):
        return f'vul: {self.cve_id}  os: {self.os} software: {self.software_name}'


class SecurityAdvisoryModel(VulBaseModel):
    host = models.ManyToManyField(to=HostModel, verbose_name='关联主机', db_constraint=False)

    class Meta:
        db_table = "sys_sa"
        unique_together = [['cve_id', 'software_name', 'fixed_version', 'os']]

    def __str__(self):
        return f'Fixed CVE with errata：{self.cve_id} os: {self.os} software: {self.software_name}'


class SecurityAdvisoryFixHistoryModel(BaseModel):
    cve_id = models.CharField(max_length=100)
    vul_level = models.CharField(max_length=100)
    fixed_at = models.CharField(max_length=20, default=human_datetime, verbose_name="修复时间")
    # created_by = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=None)
    created_by = models.IntegerField(default='创建者ID')
    status = models.CharField(max_length=20, default="success", verbose_name="修复状态")
    host = models.ManyToManyField(to=HostModel, verbose_name='关联主机', through="SaFixHistToHost")

    class Meta:
        db_table = "sys_sa_fix_hist"
        unique_together = [['cve_id', 'fixed_at']]

    def __str__(self):
        return f'sa fix history：{self.cve_id} '


class SaFixHistToHost(models.Model):
    sa_fix_hist = models.ForeignKey(to=SecurityAdvisoryFixHistoryModel, on_delete=models.CASCADE)
    host = models.ForeignKey(to=HostModel, on_delete=models.CASCADE)
    status = models.CharField(max_length=10)
    details = models.TextField(default="")

    class Meta:
        db_table = "sys_sa_fix_hist_host"


class VulJobModel(models.Model):
    job_id = models.CharField(max_length=100)
    job_name = models.CharField(max_length=100)
    job_desc = models.TextField(null=True)
    job_start_time = models.DateTimeField(verbose_name="", blank=True, null=True)
    job_end_time = models.DateTimeField(verbose_name="", blank=True, null=True)
    result = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="success", verbose_name="")

    class Meta:
        db_table = "sys_vul_job"

    def __str__(self):
        return f'Vulnerability scanning job：{self.job_name} in {self.job_start_time}'


@receiver(models.signals.post_delete, sender=SaFixHistToHost)
def _on_host_delete(sender, instance: SaFixHistToHost, **kwargs):
    """使用signal级联删除SaFixHisToHost相关修复记录"""
    try:
        instance.sa_fix_hist.delete()
    except SaFixHistToHost.DoesNotExist as e:
        logger.error(e)
