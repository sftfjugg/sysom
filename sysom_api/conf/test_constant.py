# -*- encoding: utf-8 -*-
"""
@File    : test_constant.py
@Time    : 2021/11/3 14:22
@Author  : DM
@Software: PyCharm
"""
from . import BaseConstant


class TestConstant(BaseConstant):
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
