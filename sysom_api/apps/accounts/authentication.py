# -*- encoding: utf-8 -*-
"""
@File    : authentication.py
@Time    : 2021/10/29 11:04
@Author  : DM
@Software: PyCharm
"""
import logging
import jwt
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authentication import BaseAuthentication
from rest_framework.request import Request
from lib.utils import JWT

from apps.accounts.models import User

logger = logging.getLogger(__name__)


class Authentication(BaseAuthentication):
    def authenticate(self, request: Request):
        if '/doc/' in request.META.get('PATH_INFO'):
            return None
        token = request.META.get('HTTP_AUTHORIZATION')
        if not token and '/user/' in request.META.get('PATH_INFO'):
            if self._get_all_user_count():
                raise AuthenticationFailed("请联系管理员添加账号")
            else:
                return None
        if not token:
            raise AuthenticationFailed("没有令牌")
        payload = self._check_payload(token)
        user = self._check_user(payload=payload)
        logger.info(f"{user.username} 身份通过")
        return user, token

    @staticmethod
    def _check_payload(token):
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

    @staticmethod
    def _check_user(payload) -> User:
        if 'id' not in payload:
            raise AuthenticationFailed('令牌错误')

        try:
            user = User.objects.get(id=payload['id'])
        except User.DoesNotExist:
            msg = _("用户不存在！")
            raise AuthenticationFailed(msg)
        return user

    @staticmethod
    def _get_all_user_count():
        return User.objects.all().count()
