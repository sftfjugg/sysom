import logging
from drf_yasg.utils import swagger_auto_schema
from rest_framework.request import Request
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins, status
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminPermission, IsOperationPermission
from apps.accounts.serializer import UserAuthSerializer
from apps.accounts.authentication import Authentication
from . import models
from . import serializer
from lib import success, other_response

logger = logging.getLogger(__name__)


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
    authentication_classes = [Authentication]
    # permission_classes = [IsAdminPermission]


    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializer.UserListSerializer
        else:
            return serializer.AddUserSerializer

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

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return success(result=response.data, message="创建成功")

    def list(self, request, *args, **kwargs):
        data = super().list(request, *args, **kwargs)
        return success(result=data.data)

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


class AuthAPIView(APIView):
    authentication_classes = []

    @swagger_auto_schema(method='POST')
    def post(self, request):
        ser = UserAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        u, t = ser.create_token()
        u_ser = serializer.UserListSerializer(instance=u, many=False)
        result = u_ser.data
        result.update({"token": t})
        return other_response(message="登录成功", code=200, result=result)


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
    required_fields = ['row_password', 'new_password', 'new_password_again']

    def post(self, request: Request):
        user = request.user
        data = request.data
        for f in filter(lambda x: not x[1], [(field, data.get(field, None)) for field in self.required_fields]):
            return other_response(message=f'{f[0]} 不能为空', code=400, result={})
        if data.get('new_password') != data.get('new_password_again'):
            return other_response(message="两次密码不一致", code=400, result={})
        if not user.verify_password(data.get('row_password')):
            return other_response(message="原始密码错误", code=400, result={})
        try:
            user.password = user.make_password(data.get('new_password'))
            user.save()
        except Exception as e:
            logger.error(e)
            return other_response(message=f"数据库错误！{e}", code=400)
        return success(result={}, message="密码修成成功")
