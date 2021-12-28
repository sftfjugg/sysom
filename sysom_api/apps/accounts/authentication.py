# -*- encoding: utf-8 -*-
"""
@File    : authentication.py
@Time    : 2021/10/29 11:04
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
import logging
import jwt
from django.utils.translation import ugettext as _
from rest_framework_jwt.authentication import BaseAuthentication
from rest_framework_jwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers
from rest_framework.request import Request

from apps.accounts.models import User

logger = logging.getLogger(__name__)
jwt_decode_handler = api_settings.JWT_DECODE_HANDLER
jwt_get_username_from_payload = api_settings.JWT_PAYLOAD_GET_USERNAME_HANDLER


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
        try:
            payload = jwt_decode_handler(token)
        except jwt.ExpiredSignature:
            msg = _('令牌过期！.')
            raise AuthenticationFailed(msg)
        except jwt.DecodeError:
            msg = _('令牌验证失败!.')
            raise AuthenticationFailed(msg)
        return payload

    @staticmethod
    def _check_user(payload) -> User:
        username = jwt_get_username_from_payload(payload)
        if not username:
            msg = _('令牌验证失败!')
            raise AuthenticationFailed(msg)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            msg = _("用户不存在！")
            raise AuthenticationFailed(msg)
        return user

    @staticmethod
    def _get_all_user_count():
        return User.objects.all().count()
