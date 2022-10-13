import os
import socket
import datetime
from pathlib import Path


def get_ip_address():
    """ip address"""
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-^d8b9di9w&-mmsbpt@)o#e+2^z+^m4nhf+z8304%9@8y#ko46l'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'apps.vul',
    'apps.accounts',
    'apps.host',
    'apps.monitor',
    'apps.task',
    'apps.vmcore',
    'apps.alarm',
    'apps.channel',

    'rest_framework',
    'corsheaders',
    'drf_yasg',  # 在线API文档
    'channels',
    'django_filters',
    'django_apscheduler',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

DEBUG = True

# Mysql数据库
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'sysom',
        'USER': 'sysom',
        'PASSWORD': 'sysom_admin',
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}

ROOT_URLCONF = 'sysom.urls'

AUTH_USER_MODEL = 'accounts.User'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
    },
]

WSGI_APPLICATION = 'sysom.wsgi.application'
ASGI_APPLICATION = 'sysom.asgi.application'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_L10N = True
USE_TZ = True
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'index/status')

# rest_framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        # 'rest_framework.permissions.IsAuthenticated'
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.accounts.authentication.Authentication'
    ],
    'UNAUTHENTICATED_USER': None,
    'DEFAULT_VERSIONING_CLASS': "rest_framework.versioning.URLPathVersioning",
    'DEFAULT_VERSION': 'v1',  # 默认版本
    'ALLOWED_VERSIONS': ['v1', 'v2'],  # 允许的版本
    'VERSION_PARAM': 'version',

    'DEFAULT_RENDERER_CLASSES': (
        'lib.renderers.SysomJsonRender',
    ),
    'DEFAULT_PAGINATION_CLASS': 'lib.paginations.Pagination',
    'UNICODE_JSON': True,
    'EXCEPTION_HANDLER': 'lib.exception.exception_handler'
}

JWT_AUTH = {
    'JWT_EXPIRATION_DELTA': datetime.timedelta(days=1),
}

SERVICE_SVG_PATH = os.path.join(BASE_DIR, 'netinfo')

# upload file
MEDIA_URL = '/uploads/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'uploads')

SCRIPTS_DIR = os.path.join(BASE_DIR, 'service_scripts')

SERVER_IP = get_ip_address()

IS_MICRO_SERVICES = False  # 是否微服务

# sysom node resource download dir
WEB_DIR = os.path.join(BASE_DIR.parent, 'sysom_web')
DOWNLOAD_DIR = os.path.join(WEB_DIR, 'download')

# sysom service
SYSOM_SERVICE = 'http://127.0.0.1:7001'
TASK_SERVICE = 'http://127.0.0.1:7002'
CHANNEL_SERVICE = 'http://127.0.0.1:7003'

# key path
KEY_PATH = os.path.join(BASE_DIR, 'conf', 'ssh-key')

##################################################################
# Cec settings
##################################################################
SYSOM_CEC_URL = "redis://localhost:6379?cec_default_max_len=1000&cec_auto_mk_topic=true"
SYSOM_CEC_ALARM_TOPIC = "CEC-SYSOM-ALARM"
# 任务模块用于下发任务的主题
SYSOM_CEC_TASK_DELIVERY_TOPIC = "CEC-SYSOM-TASK-DELIVERY"
SYSOM_CEC_TASK_DELIVERY_GROUP = "CEC-SYSOM-TASK-DELIVERY-GROUP"         # 读取任务的消费组
# 任务模块用于下发任务处理结果的主题
SYSOM_CEC_TASK_RESULT_PROCESS_TOPIC = "CEC-SYSOM-TASK-RESULT-PROCESS"
SYSOM_CEC_TASK_RESULT_PROCESS_GROUP = "CEC-SYSOM-TASK-RESULT-PROCESS-GROUP"

# API
TASK_API = f'{TASK_SERVICE}/api/v1/tasks/'
HOST_LIST_API = f'{SYSOM_SERVICE}/api/v1/host/'
CHANNEL_VALIDATE_API = f'{CHANNEL_SERVICE}/api/v1/channel/validate/'
CHANNEL_COMMAND_API = f'{CHANNEL_SERVICE}/api/v1/channel/'
CHANNEL_RESULT_API = f'{CHANNEL_SERVICE}/api/v1/channel/exec_result/'

SERVER_LOGS_FILE = os.path.join(BASE_DIR, 'logs', 'sys_om_info.log')
ERROR_LOGS_FILE = os.path.join(BASE_DIR, 'logs', 'sys_om_error.log')
if not os.path.exists(os.path.join(BASE_DIR, 'logs')):
    os.makedirs(os.path.join(BASE_DIR, 'logs'))


# JWT Token Decode DIR
JWT_TOKEN_DECODE_DIR = os.path.join(BASE_DIR, 'lib', 'decode')
if not os.path.exists(JWT_TOKEN_DECODE_DIR):
    os.makedirs(JWT_TOKEN_DECODE_DIR)

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
