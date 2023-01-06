from cec_base.log import LoggerHelper, LoggerLevel
import os
import sys
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
    'apps.accounts',
    'apps.host',
    'apps.alarm',
    'apps.services',

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


##################################################################
# SSH channel settings
##################################################################
SSH_CHANNEL_KEY_DIR = os.path.join(BASE_DIR.parent, 'conf', 'ssh')
if not os.path.exists(SSH_CHANNEL_KEY_DIR):
    os.makedirs(SSH_CHANNEL_KEY_DIR)
SSH_CHANNEL_KEY_PRIVATE = os.path.join(SSH_CHANNEL_KEY_DIR, "sysom_id")
SSH_CHANNEL_KEY_PUB = os.path.join(SSH_CHANNEL_KEY_DIR, "sysom_id.pub")

##################################################################
# Cec settings
##################################################################
SYSOM_CEC_URL = "redis://localhost:6379?cec_default_max_len=1000&cec_auto_mk_topic=true"
SYSOM_CEC_ALARM_TOPIC = "CEC-SYSOM-ALARM"
# 通道模块用于对外开放，投递操作的主题
SYSOM_CEC_CHANNEL_TOPIC = "SYSOM_CEC_CHANNEL_TOPIC"
# 通道模块用于投递执行结果的主题
SYSOM_CEC_CHANNEL_RESULT_TOPIC = "SYSOM_CEC_CHANNEL_RESULT_TOPIC"
# 用于分发插件系统相关事件的主题
SYSOM_CEC_PLUGIN_TOPIC = "SYSOM_CEC_PLUGIN_TOPIC"
# API主机模块消费组
SYSOM_CEC_API_HOST_CONSUMER_GROUP = "SYSOM_CEC_API_HOST_CONSUMER_GROUP"
# HOST用于接收其他模块发出的异步请求的主题
SYSOM_CEC_API_HOST_TOPIC = "SYSOM_CEC_API_HOST_TOPIC"

##################################################################
# Channel settings
##################################################################
SYSOM_HOST_LISTEN_TOPIC = "SYSOM_HOST_LISTEN_TOPIC"
SYSOM_HOST_CONSUME_GROUP = "SYSOM_HOST_CONSUME_GROUP"
SYSOM_HOST_CEC_URL = f"{SYSOM_CEC_URL}&channel_job_target_topic={SYSOM_CEC_CHANNEL_TOPIC}&channel_job_listen_topic={SYSOM_HOST_LISTEN_TOPIC}&channel_job_consumer_group={SYSOM_HOST_CONSUME_GROUP}"
# Host init timeout (seconds)
HOST_INIT_TIMEOUT = 600

# JWT Token Decode DIR
JWT_TOKEN_DECODE_DIR = os.path.join(BASE_DIR, 'lib', 'decode')
if not os.path.exists(JWT_TOKEN_DECODE_DIR):
    os.makedirs(JWT_TOKEN_DECODE_DIR)


# Config log format
log_format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{file.path}</cyan>:<cyan>{line}</cyan> | {message}"
LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO,
                 format=log_format, colorize=True)
LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING,
                 format=log_format, colorize=True)
