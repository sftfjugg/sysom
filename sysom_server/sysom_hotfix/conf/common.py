import os
import datetime
import sys
from pathlib import Path
from sysom_utils import ConfigParser, CecTarget
from cec_base.log import LoggerHelper, LoggerLevel


BASE_DIR = Path(__file__).resolve().parent.parent

##################################################################
# Load yaml config first
##################################################################
YAML_GLOBAL_CONFIG_PATH = f"{BASE_DIR.parent.parent}/conf/config.yml"
YAML_SERVICE_CONFIG_PATH = f"{BASE_DIR}/config.yml"

YAML_CONFIG = ConfigParser(YAML_GLOBAL_CONFIG_PATH, YAML_SERVICE_CONFIG_PATH)

##########################################################################################
# Django Config
##########################################################################################

SECRET_KEY = YAML_CONFIG.get_server_config().jwt.get("SECRET_KEY", "")
# JWT Token Decode DIR
JWT_TOKEN_DECODE_DIR = os.path.join(BASE_DIR, 'lib', 'decode')
if not os.path.exists(JWT_TOKEN_DECODE_DIR):
    os.makedirs(JWT_TOKEN_DECODE_DIR)
JWT_TOKEN_EXPIRE = YAML_CONFIG.get_server_config().jwt.get(
    "TOKEN_EXPIRE", 60 * 60 * 24 * 2)
JWT_AUTH = {
    'JWT_EXPIRATION_DELTA': datetime.timedelta(seconds=JWT_TOKEN_EXPIRE),
}


ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'apps.hotfix',

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

ROOT_URLCONF = 'sysom_hotfix.urls'

WSGI_APPLICATION = 'sysom_hotfix.wsgi.application'
ASGI_APPLICATION = 'sysom_hotfix.asgi.application'

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
MEDIA_URL = '/uploads/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'uploads')

##################################################################
# Hotfix Platform settings
##################################################################
HOTFIX_FILE_STORAGE_REPO = "/usr/local/sysom/server/hotfix_builder/hotfix-nfs"

##################################################################
# Cec settings
##################################################################
SYSOM_CEC_URL = YAML_CONFIG.get_cec_url(CecTarget.PRODUCER)
SYSOM_CEC_HOTFIX_TOPIC = "hotfix_job"

##################################################################
# Config settings
##################################################################
# Config log format
log_format = YAML_CONFIG.get_server_config().logger.format
LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO,
                 format=log_format, colorize=True)
LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING,
                 format=log_format, colorize=True)
