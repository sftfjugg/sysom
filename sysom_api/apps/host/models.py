from django.db import models
from lib import BaseModel
from apps.accounts.models import User

from lib.ssh import SSH


class HostModel(BaseModel):
    HOST_STATUS_CHOICES = (
        (0, 'running'),
        (1, 'error'),
        (2, 'offline')
    )

    hostname = models.CharField(max_length=100, unique=True)
    ip = models.CharField(max_length=100, unique=True)
    port = models.IntegerField()
    username = models.CharField(max_length=100)
    private_key = models.TextField(null=True)
    description = models.CharField(max_length=255, null=True)
    status = models.IntegerField(choices=HOST_STATUS_CHOICES, default=2, verbose_name="主机状态")
    client_deploy_cmd = models.TextField(verbose_name="client部署命令", default="")
    h_type = models.ForeignKey('HostType', on_delete=models.CASCADE, related_name='hosts')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="c_hosts")
    deleted_by = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="d_hosts")

    class Meta:
        db_table = "sys_host"

    def __str__(self):
        return f'主机：{self.hostname}'

    def get_host_client(self, pkey=None, default_env=None):
        pkey = pkey or self.private_key
        return SSH(hostname=self.ip, port=self.port, username=self.username, pkey=pkey, default_env=default_env)


class HostType(BaseModel):
    type_name = models.CharField(max_length=128, unique=True)

    class Meta:
        db_table = "sys_host_type"

    def __str__(self) -> str:
        return f'主机类型: {self.type_name}'
