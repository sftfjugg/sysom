import logging
import os
import threading
import requests
from django.core.files.uploadedfile import InMemoryUploadedFile
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings

from apps.host import serializer
from apps.host.models import HostModel, Cluster
from apps.accounts.authentication import Authentication
from apps.task.views import script_task
from consumer.executors import SshJob
from apps.task.models import JobModel
from lib import *
from lib.exception import APIException

logger = logging.getLogger(__name__)


class HostModelViewSet(GenericViewSet,
                       mixins.ListModelMixin,
                       mixins.RetrieveModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.CreateModelMixin,
                       mixins.DestroyModelMixin
                       ):
    queryset = HostModel.objects.filter(deleted_at=None)
    serializer_class = serializer.HostListSerializer
    authentication_classes = [Authentication]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ip', 'hostname', 'cluster', 'status']

    def get_authenticators(self):
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def create(self, request, *args, **kwargs):
        password = request.data.pop('host_password', None)
        if not password:
            return not_found(message=f'host_password required!')

        b, k = generate_private_key(
            hostname=request.data['ip'], port=request.data['port'], username=request.data['username'], password=password
        )
        if not b:
            return other_response(code=400, message=f"主机验证失败：{k}")
        request.data.update({'private_key': k})

        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        self.perform_create(create_serializer)
        instance = create_serializer.instance
        # 检查输入client部署命令 更新host状态
        thread = threading.Thread(target=self.client_deploy_cmd_init, args=(instance,))
        thread.start()
        host_list_serializer = serializer.HostListSerializer(instance=instance)
        return success(result=host_list_serializer.data)

    def perform_create(self, ser):
        ser.save(created_by=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.check_instance_exist(request, *args, **kwargs)
        if not instance:
            return not_found()
        ser = self.get_serializer(instance)
        return success(result=ser.data)

    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializer.HostListSerializer
        else:
            return serializer.AddHostSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.check_instance_exist(request, *args, **kwargs)
        if not instance:
            return not_found()
        status, content = self.client_deploy_cmd_delete(instance)
        if status != 200:
            return other_response(message="删除失败，清除脚本执行失败，错误如下：{}".format(content.get("message")), code=400, success=False)
        self.perform_destroy(instance)
        return success(message="删除成功", code=200, result={})

    def perform_destroy(self, instance: HostModel):
        instance.deleted_at = human_datetime()
        instance.deleted_by = self.request.user
        instance.save()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return success(result=response.data, message="修改成功")

    def check_instance_exist(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        return instance if instance else None

    def client_deploy_cmd_init(self, instance):
        data = {"service_name": "node_init",
                "instance": instance.ip,
                "update_host_status": True
                }
        script_task(data)

    def client_deploy_cmd_delete(self, instance):
        try:
            data = {"service_name": "node_delete",
                    "instance": instance.ip
                    }
            resp = script_task(data)
            logger.info(resp.status_code, resp.data)
            return resp.status_code, resp.data
        except Exception as e:
            logger.error(e, exc_info=True)
            return False, str(e)


class ClusterViewSet(GenericViewSet,
                      mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.DestroyModelMixin,
                      mixins.CreateModelMixin,
                      mixins.UpdateModelMixin):
    queryset = Cluster.objects.filter(Q(deleted_at=None) | Q(deleted_at=""))
    serializer_class = serializer.ClusterListSerializer

    def get_authenticators(self):
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializer.ClusterListSerializer
        else:
            return serializer.AddClusterSerializer

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return success(result=response.data)

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return success(result={}, message="新增成功")

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return success(result={}, message="修改成功")


class SaveUploadFile(APIView):
    authentication_classes = []

    @swagger_auto_schema(operation_description="上传文件",
                         request_body=openapi.Schema(
                             type=openapi.TYPE_OBJECT,
                             required=["file"],
                             properties={
                                 "file": openapi.Schema(type=openapi.TYPE_FILE),
                                 "catalogue": openapi.Schema(type=openapi.TYPE_STRING)

                             }
                         ),
                         responses={
                             '200': openapi.Response('save upload success', examples={"application/json": {
                                 "code": 200,
                                 "message": "Upload success",
                                 "data": {}
                             }}),
                             '400': openapi.Response('Fail', examples={"application/json": {
                                 "code": 400,
                                 "message": "Required Field: file",
                                 "data": {}
                             }})
                         }
                         )
    def post(self, request):
        file = request.data.get('file', None)
        catalogue = request.data.get('catalogue', None)
        if not file:
            return APIException(message="Upload Failed: file required!")

        file_path = os.path.join(
            settings.MEDIA_ROOT, catalogue) if catalogue else settings.MEDIA_ROOT
        if not os.path.exists(file_path):
            os.makedirs(file_path)
        path = os.path.join(file_path, file.name)
        try:
            with open(path, 'wb') as f:
                for chunk in file.chunks():
                    f.write(chunk)
        except Exception as e:
            logger.error(e)
            raise APIException(message=f"Upload Failed: {e}")
        return success(result={}, message="Upload success")
