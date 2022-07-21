from conf.common import *

"""
Channels Model Micro Service Settings
"""

INSTALLED_APPS = [
    'apps.channel',

    # 第三方模块
    'rest_framework'
]

IS_MICRO_SERVICES = True

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (),
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'UNAUTHENTICATED_USER': None,
    'DEFAULT_VERSIONING_CLASS': "rest_framework.versioning.URLPathVersioning",
    'DEFAULT_VERSION': 'v1',  # 默认版本
    'ALLOWED_VERSIONS': ['v1', 'v2'],  # 允许的版本
    'VERSION_PARAM': 'version',

    'DEFAULT_PAGINATION_CLASS': 'lib.paginations.Pagination',
    'UNICODE_JSON': False,
    'EXCEPTION_HANDLER': 'lib.exception.exception_handler'
}

ACCESS_KEY = 'LTAI5tECx9QCCg5cwcJgJTW4'                # 设置 AccessKey ID
ACCESS_KEY_SECRET = '15rhOE4jX5zzQQXgcK9EPb714J0Xic'   # 设置 AccessKey Secret
