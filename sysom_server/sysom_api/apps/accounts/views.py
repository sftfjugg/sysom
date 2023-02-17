from datetime import datetime
from loguru import logger
from typing import Union
from django.conf import settings
from rest_framework.request import Request
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins, status
from rest_framework.status import *
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView

from apps.accounts.permissions import IsAdminPermission
from apps.accounts.serializer import UserAuthSerializer
from apps.accounts.authentication import Authentication

from . import models
from . import serializer
from lib.response import success, other_response
from django.core.cache import cache

class UserModelViewSet(
    GenericViewSet,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin
):
    queryset = models.User.objects.all()
    serializer_class = serializer.UserListSerializer
    # permission_classes = [IsAdminPermission]
    logging_options = {
        'login': 0,
        'action': 1
    }

    def get_serializer_class(self):
        method = self.request.method
        if method == 'GET':
            return serializer.UserListSerializer
        elif method == 'PUT':
            return serializer.UpdateUserSerializer
        else:
            return serializer.AddUserSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return []
        else:
            return [permission() for permission in self.permission_classes]

    def get_user_info(self, request):
        """获取用户信息"""
        serializer = self.get_serializer(request.user)
        return success(result=serializer.data)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return success(result=response.data, message="创建成功")

    def list(self, request, *args, **kwargs):
        # data = super().list(request, *args, **kwargs)
        return super().list(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        u_serializer = self.get_serializer(instance, data=request.data, partial=partial)
        u_serializer.is_valid(raise_exception=True)
        self.perform_update(u_serializer)

        result = serializer.UserListSerializer(instance=u_serializer.instance, many=False)
        return success(result=result.data, message="修改成功")

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return success(result={}, message="删除成功")

    def retrieve(self, request, *args, **kwargs):
        result = super().retrieve(request, *args, **kwargs)
        return success(result=result.data, message="获取成功")

    def get_logs(self, request):
        queryset = self._filter_log_params(request, models.HandlerLog.objects.select_related().all())
        user = getattr(request, 'user', None)
        if not user.is_admin:
            queryset = queryset.filter(user=user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            ser = serializer.HandlerLoggerListSerializer(page, many=True)
            return self.get_paginated_response(ser.data)

        ser = serializer.HandlerLoggerListSerializer(queryset, many=True)
        return success(result=ser.data)

    def _filter_log_params(self, request, queryset):
        kwargs = dict()
        params = request.query_params.dict()
        request_option = params.pop('request_option', None)
        if request_option:
            option = self.logging_options.get(request_option, None)
            if option is not None:
                kwargs['request_option'] = option
        request_ip = params.get('request_ip', None)
        request_url = params.get('request_url', None)
        request_method: str = params.get('request_method', None)
        response_status = params.get('response_status', None)
        start_time = params.get('startTime', '2000-01-01 00:00:00')
        end_time = params.get('endTime', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

        if request_ip:
            kwargs['request_ip'] = request_ip
        if request_url:
            kwargs['request_url'] = request_url
        if request_method:
            kwargs['request_method'] = request_method
        if response_status:
            kwargs['response_status'] = response_status

        queryset = queryset.filter(created_at__range=[start_time, end_time], **kwargs)
        return queryset

    def get_response_code(self, request):
        status_map = [{'label': k, 'value': v}for k, v in globals().items() if k.startswith('HTTP')]
        return success(result=status_map)


class AuthAPIView(CreateAPIView):
    authentication_classes = []

    def post(self, request):
        ser = UserAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        u, t = ser.create_token()
        u_ser = serializer.UserListSerializer(instance=u, many=False)
        result = u_ser.data
        result.update({"token": t})
        return other_response(message="登录成功", code=200, result=result)


class AccountAuthView(GenericViewSet):
    queryset = models.User.objects.filter(deleted_at=None)
    authentication_classes = [Authentication]

    def login(self, request):
        """用户登录，获取接口令牌
        token存放在redis中, 如果用户已登录,
        就返回token中的用户token, 若token过
        期后这重新登录产生新token设置默认过期
        值, 并重新存入redis. 
        """
        ser = UserAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        u, t = ser.create_token()

        # 检查用户是否允许登录
        if not u.allow_login:
            return other_response(message='请联系管理员, 开启登录!', code=400)

        u_ser = serializer.UserListSerializer(instance=u, many=False)
        result = u_ser.data
        cache_user_token = cache.get(t)

        if cache_user_token is not None:
            result.update({"token": cache_user_token})
        else:
            result.update({"token": t})
            cache.set(t, u.pk, timeout=settings.JWT_TOKEN_EXPIRE)
        return other_response(message="登录成功", code=200, result=result)

    def logout(self, request: Request):
        """用户登出 清除缓存中的用户token信息"""
        cache.delete(request.META.get('HTTP_AUTHORIZATION'))
        return success(message='退出成功', result={})

    def get_authenticators(self):
        if self.request.method == "POST":
            return []
        else:
            return super().get_authenticators()


class RoleModelViewSet(GenericViewSet,
                       mixins.CreateModelMixin,
                       mixins.ListModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.RetrieveModelMixin):
    queryset = models.Role.objects.all()
    serializer_class = serializer.RoleListSerializer
    authentication_classes = [Authentication]
    permission_classes = [IsAdminPermission]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializer.RoleListSerializer
        else:
            return serializer.AddRoleSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return []
        else:
            return [permission() for permission in self.permission_classes]

    def get_authenticators(self):
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def retrieve(self, request, *args, **kwargs):
        result = super().retrieve(request, *args, **kwargs)
        return success(result=result.data)

    def create(self, request, *args, **kwargs):
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        self.perform_create(create_serializer)

        ser = serializer.RoleListSerializer(instance=create_serializer.instance, many=False)
        return other_response(result=ser.data, code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        u_serializer = self.get_serializer(instance, data=request.data, partial=partial)
        u_serializer.is_valid(raise_exception=True)
        self.perform_update(u_serializer)
        result = serializer.RoleListSerializer(instance=u_serializer.instance, many=False)
        return success(message="修改成功", result=result.data)


class PermissionViewSet(GenericViewSet,
                        mixins.CreateModelMixin,
                        mixins.ListModelMixin,
                        mixins.UpdateModelMixin,
                        ):
    queryset = models.Permission.objects.all()
    serializer_class = serializer.PermissionListSerializer
    authentication_classes = [Authentication]
    permission_classes = [IsAdminPermission]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializer.PermissionListSerializer
        else:
            return serializer.AddPermissionSerializer

    def get_authenticators(self):
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def get_permissions(self):
        if self.request.method == "GET":
            return []
        else:
            return [permission() for permission in self.permission_classes]

    def create(self, request, *args, **kwargs):
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        self.perform_create(create_serializer)
        ser = serializer.PermissionListSerializer(instance=create_serializer.instance, many=False)
        return success(result=ser.data)


class ChangePasswordViewSet(APIView):
    """Change User Password"""
    authentication_classes = []
    required_fields = ['username', 'row_password', 'new_password', 'new_password_again']

    @classmethod
    def _verfiy_user(cls, username: str, password: str) -> Union[None, models.User]:
        """
        验证用户
        @args username<str>: 用户名称
        @args password<str>: 用户登录的明文密码
        """
        try:
            user: models.User = models.User.objects.get(username=username)
        except models.User.DoesNotExist:
            return None
        else:
            return user if user.verify_password(plain_password=password) else None

    def post(self, request: Request):
        """
        用户修改密码
        """
        data = request.data
        for f in filter(lambda x: not x[1], [(field, data.get(field, None)) for field in self.required_fields]):
            return other_response(message=f'{f[0]} 不能为空', code=400, result={})

        if data['new_password'] != data['new_password_again']:
            return other_response(message="两次密码不一致", code=400, result={}, success=False)

        user = self._verfiy_user(data['username'], data['row_password'])
        if user is None:
            return other_response(message='请检查原账号信息', code=400, result={}, success=False)

        try:
            user.password = user.make_password(data.get('new_password'))
            user.save()
        except Exception as e:
            logger.error(e)
            return other_response(message=f"数据库错误！{e}", code=400, success=False)
        return success(result={}, message="密码修成成功")
