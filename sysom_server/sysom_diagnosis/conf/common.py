from cec_base.log import LoggerHelper, LoggerLevel
import sys
import os
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
# Diagnosis Service config
##########################################################################################

SCRIPTS_DIR = os.path.join(BASE_DIR, 'service_scripts')

##################################################################
# Cec settings
##################################################################
SYSOM_CEC_PRODUCER_URL = YAML_CONFIG.get_cec_url(CecTarget.PRODUCER)
# 诊断模块消费组
SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP = "SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP"
# 诊断任务下发主题（由 View -> Executor）
SYSOM_CEC_DIAGNOSIS_TASK_DISPATCH_TOPIC = "SYSOM_CEC_DIAGNOSIS_TASK_DISPATCH_TOPIC"

# channl_job SDK 需要的url
CHANNEL_JOB_URL = YAML_CONFIG.get_local_channel_job_url()

##########################################################################################
# Django Config
##########################################################################################

SECRET_KEY = YAML_CONFIG.get_server_config().jwt.get("SECRET_KEY", "")

# JWT Token Decode DIR
JWT_TOKEN_DECODE_DIR = os.path.join(BASE_DIR, 'lib', 'decode')
if not os.path.exists(JWT_TOKEN_DECODE_DIR):
    os.makedirs(JWT_TOKEN_DECODE_DIR)

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
# Config settings
##################################################################
# Config log format
log_format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{file.path}</cyan>:<cyan>{line}</cyan> | {message}"
LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO,
                 format=log_format, colorize=True)
LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING,
                 format=log_format, colorize=True)
