import logging
import os
from django.conf import settings
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework.authentication import BaseAuthentication
from .utils import import_module


logger = logging.getLogger(__name__)


class TaskAuthentication(BaseAuthentication):
    def authenticate(self, request: Request):
        token = request.META.get('HTTP_AUTHORIZATION')
        payload = self._decode_token(token)
        payload['token'] = token
        if 'sub' in payload: payload['id'] = int(payload['sub'])
        return payload, _

    @staticmethod
    def get_jwt_decode_classes() -> list:
        jwt_decode_classes = []
        import_strings = [
            f'lib.decode.{f.replace(".py", "")}' for f in os.listdir(settings.JWT_TOKEN_DECODE_DIR)
        ]
        for string in import_strings:
            module = import_module(string)
            try:
                m = getattr(module, 'JWTTokenDecode')
                jwt_decode_classes.append(m())
            except Exception as exc:
                logger.warn(exc)
        return jwt_decode_classes

    def _decode_token(self, token):
        error_message, state = "", False
        for t in TaskAuthentication.get_jwt_decode_classes():
            r, s = t.decode(token)
            if not s:
                error_message += r
                continue
            else:
                state = s
                break            
        if not state:
            raise AuthenticationFailed(error_message)
        return r