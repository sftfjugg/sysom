from django.db import models
from lib import BaseModel

# Create your models here.
class Panic(BaseModel):
    name = models.CharField(max_length=128,unique=True)
    ip = models.CharField(max_length=64,null=True)
    hostname = models.CharField(max_length=128)
    vertype = models.IntegerField()
    status = models.IntegerField()
    core_time = models.DateTimeField()
    vmcore_file = models.CharField(max_length=256)
    dmesg_file = models.CharField(max_length=256)
    dmesg = models.TextField()
    title = models.CharField(max_length=128)
    ver = models.CharField(max_length=128)
    rip = models.CharField(max_length=64)
    func_name = models.CharField(max_length=64)
    comm = models.CharField(max_length=64)
    calltrace = models.CharField(max_length=256)
    crashkey = models.CharField(max_length=256)
    modules = models.CharField(max_length=512)
    upload_time = models.IntegerField()
    issue_id = models.IntegerField()
    panic_type = models.CharField(max_length=64)
    panic_class = models.CharField(max_length=64)

    class Meta:
        db_table = "panic"


class Issue(BaseModel):
    calltrace = models.CharField(max_length=256)
    crashkey = models.CharField(max_length=256)
    solution = models.TextField()
    class Meta:
        db_table = "issue"

class Calltrace(BaseModel):
    name = models.CharField(max_length=128)
    line = models.CharField(max_length=128)
    idx = models.IntegerField()
    vmcore = models.ForeignKey(to='Panic',on_delete=models.CASCADE, to_field='name', related_name='panic_call_trace',default='')
    class Meta:
        db_table = "call_trace"

class VmcoreConfig(BaseModel):
    name = models.CharField(max_length=128)
    server_host = models.CharField(max_length=256)
    mount_point = models.CharField(max_length=256)
    days = models.IntegerField()
    class Meta:
        db_table = "vmcore_config"
