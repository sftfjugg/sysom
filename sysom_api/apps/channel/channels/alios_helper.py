import json
import sys
import base64
import logging
from django.conf import settings

from aliyunsdkcore.client import AcsClient
from aliyunsdkecs.request.v20140526.DescribeInvocationResultsRequest import DescribeInvocationResultsRequest
from aliyunsdkecs.request.v20140526.RunCommandRequest import RunCommandRequest

from .base import BaseChannel


__all__ = ['AliosChannel']
logger = logging.getLogger(__name__)


class AliosChannel(BaseChannel):
    """
    使用第三方模块 'aliyunsdkcore' 封装ssh
    """
    
    INVOKE_STATUS = {'Success': 0}

    def __init__(self, regionid) -> None:
        self.client(
            ak=settings.ACCESS_KEY,
            secret=settings.ACCESS_KEY_SECRET,
            region_id=regionid
        )

    def client(self, **kwargs):
        setattr(self, '_client', AcsClient(**kwargs))

    def run_command(self, cmd, instance_id):
        """
        cmd: shell script
        instance_id: 实例ID
        """
        return self._exce_command('RunShellScript', cmdcontent=cmd, instance_id=instance_id)

    def _exce_command(self, cmdtype, cmdcontent, instance_id, timeout=60):
        """
        cmdtype: 命令类型： RunBatScript; RunPowerShellScript; RunShellScript
        cmdcontent: 命令内容
        instance_id: 实例ID
        """
        res, invoke_id = 1, ""
        try:
            request = RunCommandRequest()
            request.set_accept_format('json')

            request.set_Type(cmdtype)
            request.set_CommandContent(cmdcontent)
            request.set_InstanceIds([instance_id])
            # 执行命令的超时时间，单位s,默认是60s,请根据执行的实际命令来设置
            request.set_Timeout(timeout)
            response = self._client.do_action_with_exception(request)
            invoke_id = json.loads(response).get("InvokeId")
            res = 0
            return res, invoke_id
        except Exception as e:
            logger.error("run command failed")
            return res, invoke_id

    def get_invoke_result(self, invoke_id):
        request = DescribeInvocationResultsRequest()
        request.set_accept_format('json')

        request.set_InvokeId(invoke_id)
        response = self._client.do_action_with_exception(request)
        response_detail = json.loads(response)["Invocation"]["InvocationResults"]["InvocationResult"][0]
        status = response_detail.get("InvocationStatus","")
        output = self._base64_decode(response_detail.get("Output",""))
        return status, output

    def _base64_decode(self, content, code='utf-8'):
        if sys.version_info.major == 2:
            return base64.b64decode(content)
        else:
            return base64.b64decode(content).decode(code)