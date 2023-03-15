from cec_base.log import LoggerHelper, LoggerLevel
import os
import sys
import datetime
from pathlib import Path
from sysom_utils import ConfigParser, CecTarget


BASE_DIR = Path(__file__).resolve().parent.parent

##################################################################
# Load yaml config first
##################################################################
YAML_GLOBAL_CONFIG_PATH = f"{BASE_DIR.parent.parent}/conf/config.yml"
YAML_SERVICE_CONFIG_PATH = f"{BASE_DIR}/config.yml"

YAML_CONFIG = ConfigParser(YAML_GLOBAL_CONFIG_PATH, YAML_SERVICE_CONFIG_PATH)

##########################################################################################
# SysomAPI Service config
##########################################################################################
# Host init timeout (seconds)
HOST_INIT_TIMEOUT = YAML_CONFIG.get_server_config() \
    .app_host.get("HOST_INIT_TIMEOUT", 600)  # seconds
HEARTBEAT_INTERVAL = YAML_CONFIG.get_server_config() \
    .heartbeat.get("HEARTBEAT_INTERVAL", 20)  # seconds

##########################################################################################
# Django Config
##########################################################################################

SECRET_KEY = YAML_CONFIG.get_server_config().jwt.get("SECRET_KEY", "")
JWT_TOKEN_EXPIRE = YAML_CONFIG.get_server_config().jwt.get(
    "TOKEN_EXPIRE", 60 * 60 * 24 * 2)
JWT_AUTH = {
    'JWT_EXPIRATION_DELTA': datetime.timedelta(seconds=JWT_TOKEN_EXPIRE),
}
# JWT Token Decode DIR
JWT_TOKEN_DECODE_DIR = os.path.join(BASE_DIR, 'lib', 'decode')
if not os.path.exists(JWT_TOKEN_DECODE_DIR):
    os.makedirs(JWT_TOKEN_DECODE_DIR)

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
        'NAME': YAML_CONFIG.get_server_config().db.mysql.database,
        'USER': YAML_CONFIG.get_server_config().db.mysql.user,
        'PASSWORD': YAML_CONFIG.get_server_config().db.mysql.password,
        'HOST': YAML_CONFIG.get_server_config().db.mysql.host,
        'PORT': YAML_CONFIG.get_server_config().db.mysql.port,
    }
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": (
            f"redis://{YAML_CONFIG.get_server_config().db.redis.host}"
            f":{YAML_CONFIG.get_server_config().db.redis.port}/1"
        ),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "DECODE_RESPONSES": True
        }
    }
}

ROOT_URLCONF = 'sysom.urls'

AUTH_USER_MODEL = 'accounts.User'

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

# upload file
MEDIA_ROOT = os.path.join(BASE_DIR, 'uploads')

SCRIPTS_DIR = os.path.join(BASE_DIR, 'service_scripts')

IS_MICRO_SERVICES = False  # 是否微服务

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
SYSOM_CEC_URL = YAML_CONFIG.get_cec_url(CecTarget.PRODUCER)
SYSOM_CEC_ALARM_TOPIC = YAML_CONFIG.get_server_config().cec.topics.SYSOM_CEC_ALARM_TOPIC
# 用于分发插件系统相关事件的主题
SYSOM_CEC_PLUGIN_TOPIC = \
    YAML_CONFIG.get_server_config().cec.topics.SYSOM_CEC_PLUGIN_TOPIC
# API主机模块消费组
SYSOM_CEC_API_HOST_CONSUMER_GROUP = \
    YAML_CONFIG.get_server_config().cec.consumer_group
# HOST用于接收其他模块发出的异步请求的主题
SYSOM_CEC_API_HOST_TOPIC = \
    YAML_CONFIG.get_server_config().cec.topics.SYSOM_CEC_API_HOST_TOPIC

##################################################################
# Channel settings
##################################################################
# channl_job SDK 需要的url
SYSOM_HOST_CEC_URL = YAML_CONFIG.get_local_channel_job_url()


##################################################################
# Config settings
##################################################################
log_format = YAML_CONFIG.get_server_config().logger.format
LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO,
                 format=log_format, colorize=True)
LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING,
                 format=log_format, colorize=True)
