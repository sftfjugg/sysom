# -*- encoding: utf-8 -*-
"""
@File    : __init__.py.py
@Time    : 2021/11/3 11:21
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
import os
import socket
from pathlib import Path

def get_ip_address():
    """ip address"""
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)


class BaseConstant:
    SERVER_IP = get_ip_address()
    BASE_DIR = Path(__file__).resolve().parent.parent
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
    LANGUAGE_CODE = 'zh-hans'
    TIME_ZONE = 'Asia/Shanghai'
    USE_I18N = True
    USE_L10N = True
    USE_TZ = True
    STATIC_URL = '/static/'
    STATIC_ROOT = os.path.join(BASE_DIR, 'index/status')
    CLIENT_DEPLOY_CMD = 'ls /root'

    # 日志
    SERVER_LOGS_FILE = os.path.join(BASE_DIR, 'logs', 'sys_om_info.log')
    ERROR_LOGS_FILE = os.path.join(BASE_DIR, 'logs', 'sys_om_error.log')
    if not os.path.exists(os.path.join(BASE_DIR, 'logs')):
        os.makedirs(os.path.join(BASE_DIR, 'logs'))

    # 格式:[2020-04-22 23:33:01][micoservice.apps.ready():16] [INFO] 这是一条日志:
    # 格式:[日期][模块.函数名称():行号] [级别] 信息
    STANDARD_LOG_FORMAT = '[%(levelname).4s] -- %(asctime)s -- P_%(process) -- d_T_%(thread)d ' \
                          '- <%(module)s:%(lineno)d>: %(message)s'
    CONSOLE_LOG_FORMAT = '[%(levelname).4s] -- %(asctime)s -- P_%(process) -- d_T_%(thread)d ' \
                         '- <%(module)s:%(lineno)d>: %(message)s'

    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': STANDARD_LOG_FORMAT
            },
            'console': {
                'format': CONSOLE_LOG_FORMAT,
                'datefmt': '%Y-%m-%d %H:%M:%S',
            },
            'file': {
                'format': CONSOLE_LOG_FORMAT,
                'datefmt': '%Y-%m-%d %H:%M:%S',
            },
        },
        'handlers': {
            'file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': SERVER_LOGS_FILE,
                'maxBytes': 1024 * 1024 * 100,  # 100 MB
                'backupCount': 5,  # 最多备份5个
                'formatter': 'standard',
                'encoding': 'utf-8',
            },
            'error': {
                'level': 'ERROR',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': ERROR_LOGS_FILE,
                'maxBytes': 1024 * 1024 * 100,  # 100 MB
                'backupCount': 3,  # 最多备份3个
                'formatter': 'standard',
                'encoding': 'utf-8',
            },
            'console': {
                'level': 'INFO',
                'class': 'logging.StreamHandler',
                'formatter': 'console',
            }
        },
        'loggers': {
            # default日志
            '': {
                'handlers': ['console', 'error', 'file'],
                'level': 'INFO',
            },
            'django': {
                'handlers': ['console', 'error', 'file'],
                'level': 'INFO',
            },
            'scripts': {
                'handlers': ['console', 'error', 'file'],
                'level': 'INFO',
            },
            # 数据库相关日志
            'django.db.backends': {
                'handlers': [],
                'propagate': True,
                'level': 'INFO',
            },
        }
    }


env = os.environ.get("env", "testing")

Constant = None

if env == "develop":
    from .dev_constant import DevConstant

    Constant = DevConstant
    print(f"加载了环境 >> {env}")
elif env == "testing":
    from .test_constant import TestConstant

    Constant = TestConstant
    print(f"加载了环境 >> {env}")
elif env == "produce":
    from .pro_constant import ProConstant

    Constant = ProConstant
    print(f"加载了环境 >> {env}")

__all__ = ['Constant']
