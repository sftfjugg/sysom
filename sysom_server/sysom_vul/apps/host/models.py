from django.db import models
from lib.base_model import BaseModel


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
    cluster = models.ForeignKey('Cluster', on_delete=models.CASCADE, related_name='hosts', default="")
    # created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="c_hosts")
    created_by = models.IntegerField(verbose_name='创建用户')
    # deleted_by = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="d_hosts")

    class Meta:
        db_table = "sys_host"

    def __str__(self):
        return f'主机：{self.hostname}'

class Cluster(BaseModel):
    cluster_name = models.CharField(max_length=128, unique=True)
    cluster_description = models.CharField(max_length=255, default="")

    class Meta:
        db_table = "sys_cluster"

    def __str__(self) -> str:
        return f'集群: {self.cluster_name}'
