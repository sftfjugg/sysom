import os
from loguru import logger
from importlib import import_module
from typing import List
from django.conf import settings
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework.authentication import BaseAuthentication
from django.core.cache import cache


def get_jwt_decode_classes() -> List[BaseAuthentication]:
    jwt_decode_classes = []
    import_strings = [
        f'lib.decode.{f.replace(".py", "")}' for f in
        filter(lambda f: f.endswith(".py"), os.listdir(
            settings.JWT_TOKEN_DECODE_DIR))
    ]
    for string in import_strings:
        module = import_module(string)
        try:
            m = getattr(module, 'JWTTokenDecode')
            jwt_decode_classes.append(m)
        except Exception as exc:
            logger.warning(exc)
    return jwt_decode_classes


def decode_token(token: str) -> dict:
    error_message, success, result = "", False, {}
    for auth_class in get_jwt_decode_classes():
        result, success = auth_class().decode(token)
        if not success:
            error_message += result
        else:
            break
    if not success:
        raise AuthenticationFailed(error_message)
    return result


class TokenAuthentication(BaseAuthentication):
    def authenticate(self, request: Request):
        token = request.META.get('HTTP_AUTHORIZATION')
        payload = decode_token(token)
        # 判断用户是否已经手动注销登录
        if cache.get(token) is None:
            raise AuthenticationFailed('用户已退出登录!')

        payload['token'] = token
        if 'sub' in payload:
            payload['id'] = int(payload['sub'])
        return payload, _
