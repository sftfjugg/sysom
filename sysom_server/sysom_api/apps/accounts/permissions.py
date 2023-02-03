# -*- encoding: utf-8 -*-
"""
@File    : permissions.py
@Time    : 2021/11/9 13:53
@Author  : DM
@Software: PyCharm
"""
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import User


class CustomPermission(BasePermission):
    def __init__(self, message=None) -> None:
        super().__init__()
        self.message = getattr(self.__class__, 'message', '无权限')
        self.user: User = None

    def init_permission(self, request: Request, view: APIView):
        self.user = request.user

    def has_permission(self, request: Request, view: APIView):
        return True

    def has_object_permission(self, request: Request, view: APIView, obj):
        return True


class IsAdminPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_admin


class IsOperationPermission(CustomPermission):
    def has_permission(self, request, view):
        user = request.user
        if user.user_role.role_name == "运维人员":
            return True
        else:
            return False
