# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                models.py
Description:
"""
from sqlalchemy import Column, Integer, String
from app.database import Base


class ChannelSetting(Base):
    __tablename__ = "sys_channel_setting"

    id = Column(Integer, primary_key=True)
    name = Column(String(254), unique=True)
    value = Column(String(5000))
    description = Column(String(5000), default="")


class ChannelParams(Base):
    __tablename__ = "sys_channel_params"

    id = Column(Integer, primary_key=True)
    instance = Column(String(254), unique=True)
    params = Column(String(5000))
