# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                settings.py
Description:
"""
import os

env = os.environ.get("env", "product")


if env == "develop":
    from .develop import *
elif env == "testing":
    from .testing import *
elif env == "product":
    from .product import *