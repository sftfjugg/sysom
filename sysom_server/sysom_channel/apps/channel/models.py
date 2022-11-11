from django.db import models
from lib.base_model import BaseModel


class ChannelSettingModel(BaseModel):
    name = models.CharField(max_length=254, verbose_name="Channel config name", unique=True)
    value = models.TextField(verbose_name="Channel config value")
    description = models.TextField(default="", verbose_name="Channel config description")
    
    class Meta:
        db_table = 'sys_channel_setting'
    
    def __str__(self) -> str:
        return f"ChannelSetting: {self.name}: {self.value}"