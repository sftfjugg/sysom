from django.conf import settings
from lib.utils import HTTP


class Channel:
    API_CHANNEL_VALIDATE = settings.CHANNEL_VALIDATE_API
    API_CHANNEL_COMMAND = settings.CHANNEL_COMMAND_API
    API_CHANNEL_RESULT = settings.CHANNEL_RESULT_API

    @classmethod
    def http(cls, *args, **kwargs):
        return HTTP.request(*args, **kwargs)

    @classmethod
    def get_channel_result(cls, data, token, **kwargs):
        """
        response channel result
        """
        return cls.http('post', url=Channel.API_CHANNEL_RESULT, data=data, token=token, **kwargs)

    @classmethod
    def post_channel(cls, data, token, **kwargs):
        """
        channel execute cmd
        """
        return cls.http('post', url=Channel.API_CHANNEL_COMMAND, data=data, token=token, **kwargs)

    @classmethod
    def channel_validate(cls, data, **kwargs):
        """
        channel validate 
        data parameter
        {
            "ip": "xxx.xxx.xxx.xxx",
            "password": "123456"
        }
        """
        return cls.http('post', url=Channel.API_CHANNEL_VALIDATE, data=data, **kwargs)
