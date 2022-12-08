from loguru import logger
import os
from typing import List
from django.conf import settings
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework.authentication import BaseAuthentication
from .utils import import_module




def get_jwt_decode_classes() -> List[BaseAuthentication]:
    jwt_decode_classes = []
    import_strings = [
        f'lib.decode.{f.replace(".py", "")}' for f in os.listdir(settings.JWT_TOKEN_DECODE_DIR)
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


class VulAuthentication(BaseAuthentication):
    def authenticate(self, request: Request):
        token = request.META.get('HTTP_AUTHORIZATION')
        if token is None:
            raise AuthenticationFailed(detail='Not Authorization Token!')
        payload = decode_token(token)
        payload['token'] = token
        if 'sub' in payload:
            payload['id'] = int(payload['sub'])
        return payload, _
