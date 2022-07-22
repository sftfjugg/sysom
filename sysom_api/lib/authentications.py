import logging
import jwt
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_jwt.authentication import BaseAuthentication
from rest_framework_jwt.settings import api_settings
from rest_framework.request import Request


logger = logging.getLogger(__name__)
jwt_decode_handler = api_settings.JWT_DECODE_HANDLER
jwt_get_username_from_payload = api_settings.JWT_PAYLOAD_GET_USERNAME_HANDLER


class TaskAuthentication(BaseAuthentication):
    def authenticate(self, request: Request):
        token = request.META.get('HTTP_AUTHORIZATION')
        payload = self._decode_token(token)
        payload['token'] = token
        return payload, _

    def _decode_token(self, token):
        try:
            payload = jwt_decode_handler(token)
        except jwt.ExpiredSignature:
            msg = _('令牌过期！，请重新登录')
            raise AuthenticationFailed(msg)
        except jwt.DecodeError:
            msg = _('令牌验证失败!.')
            raise AuthenticationFailed(msg)
        return payload