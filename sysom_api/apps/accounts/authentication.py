# -*- encoding: utf-8 -*-
"""
@File    : authentication.py
@Time    : 2021/10/29 11:04
@Author  : DM
@Software: PyCharm
"""
import os
import logging
from django.conf import settings
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authentication import BaseAuthentication
from rest_framework.request import Request
from lib.utils import JWT, import_module

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
    def get_jwt_decode_classes():
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
                logger.error(exc)
        
        return jwt_decode_classes

    @staticmethod
    def _check_payload(token):
        error_message, state = "", False
        for t in Authentication.get_jwt_decode_classes():
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

    @staticmethod
    def _check_user(payload) -> User:
        username = payload.get('username', None) or payload.get('name', None)
        id = payload.get('id', None) or payload.get('sub', None)
        if not username:
            raise AuthenticationFailed('令牌错误, 用户不存在!')
        u, _ = User.objects.get_or_create(username=username, is_agree=True, id=int(id))
        return u

    @staticmethod
    def _get_all_user_count():
        return User.objects.all().count()
