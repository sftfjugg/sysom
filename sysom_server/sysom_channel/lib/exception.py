import logging
import traceback

from django.db.models import ProtectedError
from rest_framework.views import set_rollback
from rest_framework import exceptions
from rest_framework.exceptions import APIException as DRFAPIException, AuthenticationFailed, NotAuthenticated

from .response import ErrorResponse


logger = logging.getLogger(__name__)


class APIException(Exception):
    def __init__(self, code=400, message='API异常', args=('API异常',)):
        self.code = code
        self.message = message
        self.args = args

    def __str__(self):
        return self.message


class FileNotFoundException(Exception):
    def __init__(self, code=404, message='文件不存在'):
        self.code = code
        self.message = message

    def __str__(self):
        return self.message

 
def exception_handler(exc, context):
    """自定义异常处理"""
    msg = ''
    code = 400

    if isinstance(exc, FileNotFoundException):
        code = exc.code
        msg = exc.message
    if isinstance(exc, AuthenticationFailed):
        code = 403
        msg = exc.detail
    elif isinstance(exc, NotAuthenticated):
        code = 402
        msg = exc.detail
    elif isinstance(exc, DRFAPIException):
        set_rollback()
        # print(exc.detail)
        # msg = {str(e) for e in exc.detail}
        msg = exc.detail
    elif isinstance(exc, exceptions.APIException):
        set_rollback()
        msg = exc.detail
    elif isinstance(exc, ProtectedError):
        set_rollback()
        msg = "删除失败:该条数据与其他数据有相关绑定"
    elif isinstance(exc, Exception):
        logger.error(traceback.format_exc())
        msg = str(exc)  # 原样输出错误

    return ErrorResponse(msg=msg, code=code, status=code)
