import sys
import os
import socket
from pathlib import Path


def get_ip_address():
    """ip address"""
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-^d8b9di9w&-mmsbpt@)o#e+2^z+^m4nhf+z8304%9@8y#ko46l'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'apps.task',

    'rest_framework',
    'corsheaders',
    'django.contrib.staticfiles',
    'drf_yasg',  # 在线API文档
    'django_filters',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

DEBUG = True

SCRIPTS_DIR = os.path.join(BASE_DIR, 'service_scripts')

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

ROOT_URLCONF = 'sysom_diagnosis.urls'

WSGI_APPLICATION = 'sysom_diagnosis.wsgi.application'
ASGI_APPLICATION = 'sysom_diagnosis.asgi.application'

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
    # 'DEFAULT_AUTHENTICATION_CLASSES': [
    #     'apps.accounts.authentication.Authentication'
    # ],
    'UNAUTHENTICATED_USER': None,
    'DEFAULT_VERSIONING_CLASS': "rest_framework.versioning.URLPathVersioning",
    'DEFAULT_VERSION': 'v1',  # 默认版本
    'ALLOWED_VERSIONS': ['v1', 'v2'],  # 允许的版本
    'VERSION_PARAM': 'version',

    # 'DEFAULT_RENDERER_CLASSES': (
    #     'lib.renderers.SysomJsonRender',
    # ),
    'DEFAULT_PAGINATION_CLASS': 'lib.paginations.Pagination',
    'UNICODE_JSON': True,
    'EXCEPTION_HANDLER': 'lib.exception.exception_handler'
}

##################################################################
# Cec settings
##################################################################
SYSOM_CEC_URL = "redis://localhost:6379?cec_default_max_len=1000&cec_auto_mk_topic=true"
SYSOM_CEC_ALARM_TOPIC = "CEC-SYSOM-ALARM"
# 通道模块用于对外开放，投递操作的主题
SYSOM_CEC_CHANNEL_TOPIC = "SYSOM_CEC_CHANNEL_TOPIC"
# 通道模块用于投递执行结果的主题
SYSOM_CEC_CHANNEL_RESULT_TOPIC = "SYSOM_CEC_CHANNEL_RESULT_TOPIC"
# 诊断模块用于接收通道执行结果的主题
SYSOM_CEC_CHANNEL_DIAGNOSIS_TOPIC = "SYSOM_CEC_CHANNEL_DIAGNOSIS_TOPIC"
# 诊断模块消费组
SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP = "SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP"
# 诊断模块用于汇报最终诊断执行结果的主题
SYSOM_CEC_DIAGNOSIS_RESULT_TOPIC = "SYSOM_CEC_DIAGNOSIS_RESULT_TOPIC"
# 用于分发插件系统相关事件的主题
SYSOM_CEC_PLUGIN_TOPIC = "SYSOM_CEC_PLUGIN_TOPIC"
# 诊断任务下发主题（由 View -> Executor）
SYSOM_CEC_DIAGNOSIS_TASK_DISPATCH_TOPIC = "SYSOM_CEC_DIAGNOSIS_TASK_DISPATCH_TOPIC"

# channl_job SDK 需要的url
CHANNEL_JOB_URL = f"{SYSOM_CEC_URL}&channel_job_target_topic={SYSOM_CEC_CHANNEL_TOPIC}" \
                  f"&channel_job_listen_topic={SYSOM_CEC_CHANNEL_DIAGNOSIS_TOPIC}" \
                  f"&channel_job_consumer_group={SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP}"

# JWT Token Decode DIR
JWT_TOKEN_DECODE_DIR = os.path.join(BASE_DIR, 'lib', 'decode')
if not os.path.exists(JWT_TOKEN_DECODE_DIR):
    os.makedirs(JWT_TOKEN_DECODE_DIR)

# Config log format
from cec_base.log import LoggerHelper, LoggerLevel
log_format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{file.path}</cyan>:<cyan>{line}</cyan> | {message}"
LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO, format=log_format, colorize=True)
LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING, format=log_format, colorize=True)
