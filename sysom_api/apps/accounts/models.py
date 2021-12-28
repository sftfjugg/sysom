from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from lib import BaseModel


class User(BaseModel):
    username = models.CharField(max_length=128)
    password = models.CharField(max_length=255)
    is_admin = models.BooleanField(default=False)
    is_agree = models.BooleanField(default=False)
    description = models.TextField()

    role = models.ManyToManyField(to='Role', verbose_name='关联角色', db_constraint=False)

    @staticmethod
    def make_password(plain_password: str) -> str:
        return make_password(plain_password, hasher='pbkdf2_sha256')

    def verify_password(self, plain_password: str) -> bool:
        return check_password(plain_password, self.password)

    class Meta:
        db_table = 'sys_users'

    def __str__(self):
        return f"用户：{self.username}"


class Role(BaseModel):
    role_name = models.CharField(max_length=128, unique=True, verbose_name="角色名称")
    permissions = models.ManyToManyField(to='Permission', verbose_name="关联权限", db_constraint=False)

    def __str__(self):
        return self.role_name

    class Meta:
        db_table = 'sys_role'


class Permission(BaseModel):
    REQUEST_METHOD_CHOICES = (
        (0, "GET"),
        (1, "POST"),
        (2, "DELETE"),
        (3, "PUT"),
        (4, "PATCH"),
    )
    path = models.CharField(max_length=64, verbose_name="Api路径")
    method = models.IntegerField(choices=REQUEST_METHOD_CHOICES, default=0, verbose_name="请求方式")

    class Meta:
        db_table = "sys_permission"

    def __str__(self):
        return f"API：{self.path} - Method: {self.get_method_display()}"
