import logging
from paramiko.client import SSHClient, AutoAddPolicy
from paramiko.rsakey import RSAKey
from io import StringIO

logger = logging.getLogger(__name__)


class SSH:
    def __init__(
            self,
            hostname,
            port=22,
            username='root',
            pkey=None,
            password=None,
            default_env=None,
            connect_timeout=10
    ):
        self.client = None
        self.default_env = self.make_env_command(default_env)
        self.arguments = {
            'hostname': hostname,
            'port': port,
            'username': username,
            'password': password,
            'pkey': RSAKey.from_private_key(StringIO(pkey)) if isinstance(pkey, str) else pkey,
            'timeout': connect_timeout,
            'banner_timeout': 30
        }

    @staticmethod
    def generate_key():
        key_obj = StringIO()
        key = RSAKey.generate(2048)
        key.write_private_key(key_obj)
        return key_obj.getvalue(), 'ssh-rsa ' + key.get_base64()

    def get_client(self):
        if self.client is not None:
            return self.client
        self.client = SSHClient()
        self.client.set_missing_host_key_policy(AutoAddPolicy)
        self.client.connect(**self.arguments)
        return self.client

    def ping(self):
        return True

    def add_public_key(self, public_key):
        command = f'mkdir -p -m 700 ~/.ssh && \
        echo {public_key!r} >> ~/.ssh/authorized_keys && \
        chmod 600 ~/.ssh/authorized_keys'
        exit_code, out = self.exec_command(command)
        if exit_code != 0:
            raise Exception(f'add public key error: {out}')

    def exec_command(self, command, environment=None):
        ssh_session = self.client.get_transport().open_session()
        if environment:
            ssh_session.update_environment(environment)
        ssh_session.set_combine_stderr(True)
        ssh_session.exec_command(command)
        stdout = ssh_session.makefile("rb", -1)
        return ssh_session.recv_exit_status(), self.decode(stdout.read())

    def put_file(self, local_path, remote_path):
        with self as cli:
            sftp = cli.client.open_sftp()
            sftp.put(local_path, remote_path)

    def get_file(self, local_path, remote_path):
        with self as cli:
            sftp = cli.client.open_sftp()
            sftp.get(remote_path, local_path)

    def remove_file(self, path):
        sftp = self.client.open_sftp()
        sftp.remove(path)

    def make_env_command(self, environment):
        if not environment:
            return None
        str_envs = []
        for k, v in environment.items():
            k = k.replace('-', '_')
            if isinstance(v, str):
                v = v.replace("'", "'\"'\"'")
            str_envs.append(f"{k}='{v}'")
        str_envs = ' '.join(str_envs)
        return f'export {str_envs}'

    def decode(self, content):
        try:
            content = content.decode()
        except UnicodeDecodeError:
            content = content.decode(encoding='GBK', errors='ignore')
        return content

    def __enter__(self):
        self.get_client()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()

