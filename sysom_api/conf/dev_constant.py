# -*- encoding: utf-8 -*-
"""
@File    : dev_constant.py
@Time    : 2021/11/3 14:18
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
from . import BaseConstant


class DevConstant(BaseConstant):
    DEBUG = True
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',  # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
            'NAME': 'sysom',  # Or path to database file if using sqlite3.
            'USER': 'sysom',  # Not used with sqlite3.
            'PASSWORD': 'sysom_admin',
            'HOST': '127.0.0.1',
            'PORT': '3306',
        },
    }
