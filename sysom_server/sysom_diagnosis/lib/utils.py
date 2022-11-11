
# -*- encoding: utf-8 -*-
"""
@File    : utils.py
@Time    : 2021/10/28 11:09
@Author  : DM
@Software: PyCharm
"""
import uuid as UUID
import logging
from datetime import datetime
from paramiko.rsakey import RSAKey
from io import StringIO


logger = logging.getLogger(__name__)


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


def generate_key():
    key_obj = StringIO()
    key = RSAKey.generate(2048)
    key.write_private_key(key_obj)
    return key_obj.getvalue(), 'ssh-rsa ' + key.get_base64()
