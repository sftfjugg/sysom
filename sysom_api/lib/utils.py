
# -*- encoding: utf-8 -*-
"""
@File    : utils.py
@Time    : 2021/10/28 11:09
@Author  : DM
@Email   : smmic@isoftstone.com
@Software: PyCharm
"""
import uuid as UUID
import json
import logging
from datetime import datetime, date as datetime_date
from decimal import Decimal

from apscheduler.schedulers.background import BackgroundScheduler
from paramiko import BadAuthenticationType, AuthenticationException
from rest_framework.pagination import PageNumberPagination
from lib.ssh import SSH


logger = logging.getLogger(__name__)

job_defaults = {'max_instances': 10}
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
        return False, "认证失败，请检查用户名密码或密钥"
    except Exception as e:
        return False, e
