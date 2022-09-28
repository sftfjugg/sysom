
# -*- encoding: utf-8 -*-
"""
@File    : utils.py
@Time    : 2021/10/28 11:09
@Author  : DM
@Software: PyCharm
"""
import time
import uuid as UUID
import json
import logging
import jwt
import requests

from importlib import import_module
from datetime import datetime, date as datetime_date
from decimal import Decimal

from jwt import PyJWKClient
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from apscheduler.schedulers.background import BackgroundScheduler
from paramiko import BadAuthenticationType, AuthenticationException
from lib.ssh import SSH


logger = logging.getLogger(__name__)

job_defaults = {
    'max_instances': 10,
    'misfire_grace_time': None,
    'coalesce': True,
}
scheduler = BackgroundScheduler(job_defaults=job_defaults)
scheduler.start()


CHAR_SET = ("a", "b", "c", "d", "e", "f",
            "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s",
            "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5",
            "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I",
            "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
            "W", "X", "Y", "Z")


def human_datetime(date=None):
    if date:
        assert isinstance(date, datetime)
    else:
        date = datetime.now()
    return date.strftime('%Y-%m-%d %H:%M:%S')


# 转换时间格式到字符串
def datetime_str(date=None):
    return datetime.strptime(date, "%Y-%m-%d %H:%M:%S")


# 日期json序列化
class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(o, datetime_date):
            return o.strftime('%Y-%m-%d')
        elif isinstance(o, Decimal):
            return float(o)
        return json.JSONEncoder.default(self, o)


def get_request_real_ip(headers: dict):
    x_real_ip = headers.get('x-forwarded-for')
    if not x_real_ip:
        x_real_ip = headers.get('x-real-ip', '')
    return x_real_ip.split(',')[0]


def uuid_36():
    """
    返回36字符的UUID字符串(十六进制,含有-)  bc5debab-95c3-4430-933f-2e3b6407ac30
    :return:
    """
    return str(UUID.uuid4())


def uuid_32():
    """
    返回32字符的UUID字符串(十六进制)  bc5debab95c34430933f2e3b6407ac30
    :return:
    """
    return uuid_36().replace('-', '')


def uuid_8():
    """
    返回8字符的UUID字符串(非进制)  3FNWjtlD
    :return:
    """
    s = uuid_32()
    result = ''
    for i in range(0, 8):
        sub = s[i * 4: i * 4 + 4]
        x = int(sub, 16)
        result += CHAR_SET[x % 0x3E]
    return result


def url_format_dict(url_params: str):
    """转化查询参数为dict"""
    result = dict()
    try:
        for item in [{p.split('=')[0]: p.split('=')[1]} for p in url_params.split('&')]:
            result.update(item)
    except Exception as e:
        logger.error(str(e))
    return result


def generate_private_key(hostname, port, username, password=None, pkey=None):
    try:
        if password:
            private_key, public_key = SSH.generate_key()
            with SSH(hostname, port, username, password=password) as ssh:
                ssh.add_public_key(public_key)

            with SSH(hostname, port, username, private_key) as ssh:
                ssh.ping()
            return True, private_key
        if pkey:
            SSH(hostname, port, username, pkey)
            return True, pkey
    except BadAuthenticationType:
        return False, "认证类型暂不支持"
    except AuthenticationException:
        return False, "认证失败，请检查用户名密码或IP地址是否正确"
    except Exception as e:
        return False, e


def import_string(dotted_path: str):
    """
    优化import_module
    Args:
        dotted_path 动态导包路径
    Return Package 
    """
    try:
        module_path, class_name = dotted_path.rsplit('.', 1)
    except ValueError as err:
        raise ImportError("%s doesn't look like a module path" % dotted_path) from err
    module = import_module(dotted_path)

    try:
        getattr(module, 'Channel')
        return module
    except AttributeError as err:
        raise ImportError('Module "%s" does not define a "%s" attribute/class' % (
            module_path, class_name)
                          ) from err


class HTTP:
    @classmethod
    def request(cls, method: str, url: str, token, data: dict, **kwargs):
        status, result = 0, ''
        headers = {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
        method = method.upper()
        methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
        if method not in methods:
            raise Exception('请求方式不存在!')
        data = json.dumps(data)
        for _ in range(3):
            try:
                response = requests.request(method=method, url=url, json=None, headers=headers, data=data, **kwargs)
                if response.status_code != 200:
                    status = response.status_code
                    data = response.json()
                    result = data['message']
                    break
                else:
                    resp = response.json()
                    status, result = response.status_code, resp['data']
                    break
            except requests.exceptions.ConnectTimeout as e:
                logger.info('Request Timeout, retry...')
                status = 400
                result = '请求超时, 重试三次'

        return status, result


class JWT:
    @staticmethod
    def buc_decode(token: str):
        r, s = None, False
        jwks_client = PyJWKClient(settings.BUC_VERIFIED_TOKEN_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        try:
            r, s = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience="sysom",
                options={"verify_exp": False},
            ), True
        except jwt.exceptions.ExpiredSignatureError as e:
            r = f'令牌失效: {e}'
        except jwt.exceptions.DecodeError as e:
            r = f'Token 校验失败: {e}'
        return r, s

    @staticmethod
    def sysom_decode(token):
        r, s = None, False
        try:
            r, s = jwt.decode(token, key=settings.SECRET_KEY, algorithms='HS256'), True
        except jwt.exceptions.ExpiredSignatureError as e:
            r = f'令牌失效: {e}'
        except jwt.exceptions.DecodeError as e:
            r = f'Token 校验失败: {e}'
        return r, s 

    @staticmethod
    def _encode(payload: dict, exp: int=60 * 5):
        """
        生成JWT Token
        :args 
            payload 载体
            exp 过期时间 (单位秒) 默认时间5分钟
        """
        payload['exp'] = time.time() + exp
        # 默认不可逆加密算法为HS256
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

