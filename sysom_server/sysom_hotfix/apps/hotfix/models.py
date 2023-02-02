from django.db import models
from lib.base_model import BaseModel
from django.contrib.auth import get_user_model

# Hotfix sys_hotfix Design
# for building_status->0:waiting; 1:building 2:build failed 3:build success
# for hotfix_necessary->0:optional 1:recommand install 2:must install
# for hotfix_risk -> 0:low risk 1:mid risk 2:high risk
class HotfixModel(BaseModel):
    arch = models.CharField(max_length=10, verbose_name="架构")
    os_type = models.CharField(max_length=50, default="Anolis", verbose_name="操作系统类型")
    kernel_version = models.CharField(max_length=60, verbose_name="内核版本")
    patch_path = models.CharField(max_length=255, verbose_name="补丁路径")
    patch_file = models.CharField(max_length=255, default="patch", verbose_name="patch名称")
    hotfix_path = models.CharField(max_length=255, verbose_name="rpm存储路径")
    hotfix_name = models.CharField(max_length=255, default="hotfix", verbose_name="补丁名称", unique=True)
    building_status = models.IntegerField(default=0, verbose_name="构建状态")
    hotfix_necessary = models.IntegerField(default=0, verbose_name="补丁重要性")
    hotfix_risk = models.IntegerField(default=0, verbose_name="补丁风险")
    description = models.CharField(max_length=300, default="NULL", verbose_name="描述")
    log = models.TextField(default="", verbose_name="构建日志")
    log_file = models.CharField(max_length=255, verbose_name="日志存储路径")
    creator = models.CharField(max_length=20, default="admin", verbose_name="创建者")
    formal = models.BooleanField(default=0, verbose_name="正式包")
    rpm_package = models.CharField(max_length=255, verbose_name="rpm包名")

    class Meta:
        db_table = 'sys_hotfix'
        ordering = ['-created_at']

    def __str__(self):
        return self.patch_path

# This table is used to record the os_type to git location
class OSTypeModel(BaseModel):
    os_type = models.CharField(max_length=25, verbose_name="操作系统类型")
    git_repo = models.CharField(max_length=255, verbose_name="源码git仓库地址")
    image = models.CharField(max_length=255, verbose_name="该系列的构建容器镜像")

    class Meta:
        db_table = "sys_hotfix_ostype"
        ordering = ['-created_at']

# This table is used to record the relationship of kernel version to the branch and package
class KernelVersionModel(BaseModel):
    kernel_version = models.CharField(max_length=60, verbose_name="内核版本")
    os_type = models.CharField(max_length=25, verbose_name="操作系统类型")
    git_branch = models.CharField(max_length=50, verbose_name="源码git分支")
    devel_link = models.TextField(default="", verbose_name="devel包链接")
    debuginfo_link = models.TextField(default="", verbose_name="debuginfo包链接")

    class Meta:
        db_table = "sys_hotfix_kernelversion"
        ordering = ['-created_at']
