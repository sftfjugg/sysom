from django.db import models
from lib import BaseModel, human_datetime
from apps.host.models import HostModel
from apps.accounts.models import User


# Create your models here.

class VulAddrModel(models.Model):
    vul_address = models.CharField(max_length=200)
    description = models.TextField(default="")

    class Meta:
        db_table = "sys_vul_db"

    def __str__(self):
        return f'vul addresS: {self.vul_address}'


class VulBaseModel(BaseModel):
    cve_id = models.CharField(max_length=100)
    score = models.CharField(max_length=20, verbose_name="cve score")
    description = models.TextField(default="")
    pub_time = models.CharField(max_length=100, verbose_name="publish time")
    vul_level = models.CharField(max_length=100)
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
    created_by = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=None)
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
