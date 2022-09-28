import logging
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request
from rest_framework.authentication import BaseAuthentication
from .utils import JWT


logger = logging.getLogger(__name__)


class TaskAuthentication(BaseAuthentication):
    def authenticate(self, request: Request):
        token = request.META.get('HTTP_AUTHORIZATION')
        payload = self._decode_token(token)
        payload['token'] = token
        return payload, _

    def _decode_token(self, token):
        error_message, state = "", False
        for decode in [JWT.sysom_decode]:
            r, s = decode(token)
            if not s:
                error_message += r
                continue
            else:
                state = s
                break            

        if not state:
            raise AuthenticationFailed(error_message)
        return r