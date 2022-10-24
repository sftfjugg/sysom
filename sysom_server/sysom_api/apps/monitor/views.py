import logging
import os


from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework.views import APIView
from apps.accounts.authentication import Authentication
from lib.response import success
from lib.exception import FileNotFoundException

logger = logging.getLogger(__name__)
DOWNLOAD_SVG_URL = "/api/v1/download/svg/"


def _get_server_svg_list():
    """获取指定路径下的svg文件"""
    return os.listdir(settings.SERVICE_SVG_PATH)


class SvgInfoAPIView(APIView):
    authentication_classes = [Authentication]

    def get_authenticators(self):
        # return [auth() for auth in self.authentication_classes]
        return []

    def get(self, *args, **kwargs):
        response = dict()
        svg_list = _get_server_svg_list()
        response["count"] = len(svg_list)

        name_list = [svg_name.split('.')[:-1] for svg_name in svg_list]
        master_key_list = list(set([name[0] for name in name_list]))
        svg_info_list = list()

        for key in master_key_list:
            item = dict()
            item['name'] = key
            item['child'] = [
                {'child_name': svg[1], 'download_url': '%s%s' % (DOWNLOAD_SVG_URL, '.'.join(svg)+'.svg')}
                for svg in name_list if key in svg
            ]
            svg_info_list.append(item)

        response['data'] = svg_info_list
        return success(result=response)


class DownloadSvgView(APIView):
    authentication_classes = []

    @xframe_options_exempt
    def get(self, *args, **kwargs):
        name = self.get_svg_name(*args, **kwargs)
        file_path = os.path.join(settings.SERVICE_SVG_PATH, name)
        with open(file_path, 'r') as f:
            content = f.read()
        response = HttpResponse(content=content, content_type="text/xml")
        return response

    def get_svg_name(self, *args, **kwargs):
        name = kwargs.get('svg_name')
        if name not in _get_server_svg_list():
            raise FileNotFoundException()
        return name
