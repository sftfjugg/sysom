# -*- coding: utf-8 -*- #
"""
Time                2022/11/29 15:12
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                apps.py
Description:
"""
from loguru import logger
from django.apps import AppConfig


class ServicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.services'

    def ready(self):
        logger.info(">>> Services module loading success")
