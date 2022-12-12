# -*- encoding: utf-8 -*-
"""
@File    : authentication.py
@Time    : 2021/10/29 11:04
@Author  : DM
@Software: PyCharm
"""
from loguru import logger
from django.utils.translation import ugettext as _
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authentication import BaseAuthentication
from rest_framework.request import Request
from apps.accounts.models import User
from lib.authentications import decode_token


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
        payload = decode_token(token)
        user = self._check_user(payload=payload)
        logger.info(f"{user.username} 身份通过")
        return user, token

    @staticmethod
    def _check_user(payload) -> User:
        username = payload.get('username', None) or payload.get('name', None)
        id = payload.get('id', None) or payload.get('sub', None)
        if not username:
            raise AuthenticationFailed('令牌错误, 用户不存在!')
        u, _ = User.objects.get_or_create(
            username=username, is_agree=True, id=int(id))
        return u

    @staticmethod
    def _get_all_user_count():
        return User.objects.all().count()
