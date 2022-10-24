import jwt
from django.conf import settings


class JWTTokenDecode:
    """SYSOM TOken解析认证"""
    def decode(self, token):
        r, s = None, False
        try:
            r, s = jwt.decode(token, key=settings.SECRET_KEY, algorithms='HS256'), True
        except jwt.exceptions.ExpiredSignatureError as e:
            r = f'令牌失效: {e}'
        except jwt.exceptions.DecodeError as e:
            r = f'令牌校验失败: {e}'
        except jwt.exceptions.InvalidAlgorithmError as e:
            r = f'令牌不合法: {e}'
        return r, s 