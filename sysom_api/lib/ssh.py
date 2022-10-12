import logging
from paramiko.client import SSHClient, AutoAddPolicy
from paramiko.rsakey import RSAKey
from io import StringIO

logger = logging.getLogger(__name__)


class SSH:
    @staticmethod
    def generate_key():
        key_obj = StringIO()
        key = RSAKey.generate(2048)
        key.write_private_key(key_obj)
        return key_obj.getvalue(), 'ssh-rsa ' + key.get_base64()