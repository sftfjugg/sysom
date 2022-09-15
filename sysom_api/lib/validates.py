from lib.exception import APIException
from lib.utils import generate_private_key


def validate_ssh(context):
    password = context.pop('host_password', None)
    if not password:
        raise APIException(message='host_password required!')

    b, k = generate_private_key(
        hostname=context['ip'], port=context['port'], username=context['username'], password=password
    )
    if not b:
        raise APIException(message=f"主机{context['ip']}验证失败：{k}")
    context.update({'private_key': k})
    return context
