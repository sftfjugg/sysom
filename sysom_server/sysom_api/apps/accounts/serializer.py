from rest_framework import serializers

from . import models
from lib.utils import JWT
from django.conf import settings


class UserListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = models.User
        exclude = ['password']

    def get_role(self, instance: models.User):
        roles = instance.role.all()
        return RoleListSerializer(instance=roles, many=True).data


class AddUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(error_messages={'required': "用户名必填"})
    password = serializers.CharField(error_messages={'required': "密码必填"}, required=True)
    role = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = models.User
        # exclude = ('description', )
        fields = "__all__"

    def validate_username(self, attr):
        try:
            models.User.objects.get(username=attr)
        except models.User.DoesNotExist:
            return attr
        raise serializers.ValidationError("用户已存在!")

    def validate_password(self, attr):
        return models.User.make_password(attr)

    def validate_role(self, attr):
        return models.Role.objects.filter(id__in=attr)

    def save(self, **kwargs):
        count = models.User.objects.all().count()
        validated_data = {**self.validated_data, **kwargs}
        if self.instance is not None:
            is_admin = validated_data.get('is_admin', None)
            if is_admin:
                roles = models.Role.objects.filter(role_name='管理员')
                validated_data.update({'role': roles})

            self.instance: models.User = self.update(self.instance, validated_data)
            assert self.instance is not None, (
                '`update()` did not return an object instance.'
            )
        else:
            instance: models.User = self.create(validated_data)
            if count == 0:
                role = models.Role.objects.filter(role_name='管理员')
                instance.role.add(*role)
                instance.is_admin = True
            else:
                is_admin = validated_data.get("is_admin", None)
                if is_admin:
                    role = models.Role.objects.filter(role_name='管理员')
                else:
                    role = models.Role.objects.filter(role_name='普通人员')
                instance.role.add(*role)
            instance.save()
        return self.instance


class UserAuthSerializer(serializers.ModelSerializer):
    username = serializers.CharField(error_messages={'required': "用户名必填"})
    password = serializers.CharField(error_messages={'required': "密码名必填"})

    class Meta:
        model = models.User
        fields = ("username", "password")

    def validate(self, attrs):
        user = models.User.objects.get(username=attrs['username'])
        if not user.verify_password(attrs['password']):
            raise serializers.ValidationError("用户名或密码不正确！")
        return attrs

    def validate_username(self, attr):
        try:
            models.User.objects.get(username=attr)
        except models.User.DoesNotExist:
            raise serializers.ValidationError("用户名或密码不正确！")
        return attr

    def create_token(self):
        user = models.User.objects.get(username=self.data.get('username'))
        token = JWT._encode({'id': user.id, 'username': user.username}, exp=settings.JWT_TOKEN_EXPIRE)
        return user, token


class RoleListSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = models.Role
        exclude = ['deleted_at']

    def get_permissions(self, instance: models.Role):
        permissions = instance.permissions.all()
        return PermissionListSerializer(instance=permissions, many=True).data


class AddRoleSerializer(serializers.ModelSerializer):
    permissions = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = models.Role
        fields = "__all__"


class PermissionListSerializer(serializers.ModelSerializer):
    method = serializers.SerializerMethodField()

    class Meta:
        model = models.Permission
        exclude = ("deleted_at", )

    def get_method(self, instance: models.Permission):
        return instance.get_method_display()


class AddPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Permission
        exclude = ('deleted_at', )


class HandlerLoggerListSerializer(serializers.ModelSerializer):
    request_option = serializers.CharField(source='get_request_option_display', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = models.HandlerLog
        exclude = ('deleted_at', 'user')
