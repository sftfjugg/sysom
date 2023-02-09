# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                schemas.py
Description:
"""
from pydantic import BaseModel


class ChannelSetting(BaseModel):
    name: str
    value: str
    description: str

    class Config:
        orm_mode = True


class ChannelParams(BaseModel):
    instance: str
    params: str

    class Config:
        orm_mode = True


###########################################################################
# Request params
###########################################################################

class RequestParamGetFileFromNode(BaseModel):
    remote_path: str
    target_instance: str
