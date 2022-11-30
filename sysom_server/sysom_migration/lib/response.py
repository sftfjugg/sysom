from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse


def _response(data=None, status=None):
    return Response(data=data, status=status)


def success(result=None, message="success", success=True, code=status.HTTP_200_OK, **kwargs):
    data = {
        "code": code,
        "message": message,
        "data": result,
        "success": success
    }
    data.update(kwargs)
    return _response(data=data, status=code)


def not_found(code=status.HTTP_404_NOT_FOUND, success=False, message="Not Found"):
    data = {
        "code": code,
        "message": message,
        "success": success,
    }

    return _response(data=data, status=code)


def not_permission(code=status.HTTP_403_FORBIDDEN, success=False, message="Not Permission"):
    data = {
        "code": code,
        "success": success,
        "message": message
    }
    return _response(data=data, status=code)


def other_response(result=dict(), message="", success=True, code=status.HTTP_200_OK, **kwargs):
    data = {
        "code": code,
        "message": message,
        "data": result,
        "success": success
    }
    data.update(kwargs)
    return _response(data=data, status=code)


class ErrorResponse(Response):
    """
    标准响应错误的返回,ErrorResponse(msg='xxx')
    默认错误码返回400, 也可以指定其他返回码:ErrorResponse(code=xxx)
    """

    def __init__(self, data=None, msg='error', code=400, status=None, template_name=None, headers=None,
                 exception=False, content_type=None):
        std_data = {
            "code": code,
            "data": data or {},
            "message": msg
        }
        super().__init__(std_data, status, template_name, headers, exception, content_type)


class FileResponseAlter(FileResponse):
    pass
