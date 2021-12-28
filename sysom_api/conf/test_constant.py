# -*- encoding: utf-8 -*-
"""
@File    : test_constant.py
@Time    : 2021/11/3 14:22
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
from . import BaseConstant


class TestConstant(BaseConstant):
    DEBUG = True
    SERVICE_SVG_PATH = '/Users/fengfuqiu/Documents/project/sysom/netinfo'
    SERVICE_URL = 'http://11.238.158.138:8000/'
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',  # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
            'TIMEOUT': 2,
            'NAME': 'sysom_test_db',  # Or path to database file if using sqlite3.
            'USER': 'sysom',  # Not used with sqlite3.
            'PASSWORD': 'sysomtest',
            'HOST': 'rm-tattest-osdh.mysql.rdstest.tbsite.net',
            # Set to empty string for localhost. Not used with sqlite3.
            'PORT': '3306',
        },
    }
