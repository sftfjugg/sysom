import re
from loguru import logger
import os
from typing import Any
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework import mixins
from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from rest_framework.exceptions import ValidationError, NotAuthenticated
from django.conf import settings

from apps.host import serializer
from apps.common.common_model_viewset import CommonModelViewSet
from apps.host.models import HostModel, Cluster
from apps.accounts.authentication import Authentication
from lib.response import *
from lib.utils import human_datetime, datetime
from lib.exception import APIException
from lib.excel import Excel
from concurrent.futures import ThreadPoolExecutor, as_completed
from apps.alarm.views import _create_alarm_message
from channel_job import default_channel_job_executor
from prometheus_client import CollectorRegistry, generate_latest, Gauge

class HostModelViewSet(CommonModelViewSet,
                       mixins.ListModelMixin,
                       mixins.RetrieveModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.CreateModelMixin,
                       mixins.DestroyModelMixin
                       ):
    queryset = HostModel.objects.filter(deleted_at=None)
    serializer_class = serializer.HostSerializer
    authentication_classes = [Authentication]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ip', 'hostname', 'cluster', 'status']
    http_method_names = ['get', 'post', 'patch', 'delete']

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    def get_authenticators(self):
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def get_queryset(self):
        """
        通过Authentication后, 根据用户身份返回
        改用户可以操作的机器
        """
        queryset = super().get_queryset()
        if self.request.method == "GET":
            return queryset
        user = getattr(self.request, 'user', None)
        if user is None:
            raise NotAuthenticated(detail='No Authenticated!')

        if not user.is_admin:
            queryset = queryset.filter(created_by=user.pk)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return success([], total=0)
        return super(HostModelViewSet, self).list(request, *args, **kwargs)

    def perform_create(self, ser):
        ser.save(created_by=self.request.user.id)

    def create(self, request, *args, **kwargs):
        # 检查字段是否满足
        setattr(self, 'request', request)
        res = self.require_param_validate(
            request, ['hostname', 'ip', 'port', 'username'])
        if not res['success']:
            return ErrorResponse(msg=res['message'])
        res = self._thread_pool('add', tasks=[request.data],
                                func=self._validate_and_initialize_host)
        if res["success"]:
            return success(result={})
        else:
            return ErrorResponse(msg=res["message"])

    def retrieve(self, request, *args, **kwargs):
        instance = self.check_instance_exist(request, *args, **kwargs)
        if not instance:
            return not_found()
        ser = self.get_serializer(instance)
        return success(result=ser.data)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return success(result=response.data, message="修改成功")

    def partial_update(self, request, *args, **kwargs):
        """
        部分更新，由PATCH方法触发，可以传递部分字段更新部分内容
        """

        # 限制只能更新 cluster 和 description
        res = self.extract_specific_params(
            request, ["cluster", "description", "status"])
        if not res['success']:
            return ErrorResponse(msg=res['message'])
        return super(HostModelViewSet, self).partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        setattr(self, 'request', request)
        instance = self.check_instance_exist(request, *args, **kwargs)
        if not instance:
            return not_found()
        res = self._thread_pool(
            'del', [instance], func=self._destroy_host_tasks)
        if res["success"]:
            return success(message="operation success!", code=200, result={})
        else:
            return ErrorResponse(msg=res["message"])

    def _validate_and_initialize_host(self, context):
        create_serializer = self.get_serializer(data=context)
        try:
            create_serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            raise APIException(
                message=f"{self.get_format_err_msg_for_validation_error(context, e)}。主机添加失败")
        self.perform_create(create_serializer)

        instance = create_serializer.instance
        self.client_deploy_cmd_init(instance, {
            "instance": context['ip'],
            "password": context['host_password'],
            "username": context['username'],
            "port": int(context['port'])
        })
        ser = serializer.HostSerializer(instance=instance)
        return ser

    def _destroy_host_tasks(self, instance):
        ser = serializer.HostSerializer(instance=instance)
        self.perform_destroy(instance)
        self.client_deploy_cmd_delete(instance)
        return ser

    def check_instance_exist(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        return instance if instance else None

    def client_deploy_cmd_init(self, instance, params: dict):
        wait_timeout = settings.HOST_INIT_TIMEOUT
        if wait_timeout is None:
            wait_timeout = 600
        job_result = default_channel_job_executor.dispatch_job(
            channel_type="ssh", channel_opt="init",
            params={
                "instance": instance.ip,
                "username": instance.username,
                "port": instance.port,
                **params
            },
            timeout=wait_timeout * 1000,
            auto_retry=True
        ).execute()
        if job_result.code != 0:
            instance.status = 1
            instance.description = job_result.err_msg
            instance.save()
            raise APIException(message=job_result.err_msg)

        instance.status = 0
        instance.save()

        # Init success, notify all plugin to initial
        request: Request = getattr(self, 'request')
        self.produce_event_to_cec(
            settings.SYSOM_CEC_PLUGIN_TOPIC,
            {
                "type": "init",
                "params": {
                    "channel": "ssh",
                    "instance": instance.ip,
                    "username": instance.username,
                    "port": instance.port,
                    "token": request.META.get('HTTP_AUTHORIZATION')
                }
            }
        )
        logger.info(f'node init task create success')

    def client_deploy_cmd_delete(self, instance: HostModel):
        request: Request = getattr(self, 'request')
        # 通知所有插件执行清理操作
        self.produce_event_to_cec(
            settings.SYSOM_CEC_PLUGIN_TOPIC,
            {
                "type": "clean",
                "params": {
                    "channel": "ssh",
                    "instance": instance.ip,
                    "username": instance.username,
                    "port": instance.port,
                    "token": request.META.get('HTTP_AUTHORIZATION')
                },
                "echo": {
                    "instance": instance.ip,
                    "label": "host_init"
                }
            }
        )

    def _get_cluster_instance(self, cluster_name):
        try:
            instance = Cluster.objects.get(cluster_name=cluster_name)
            return instance
        except Cluster.DoesNotExist:
            return None

    def _thread_pool(self, t_type: str, tasks: list, func):
        kwargs = {}
        kwargs['sub'] = 1
        kwargs['item'] = 'host'
        pool = []
        workers = len(tasks) if len(
            tasks) < os.cpu_count() else os.cpu_count() * 2

        errMsg = None
        with ThreadPoolExecutor(max_workers=workers) as p:
            for task in tasks:
                t = p.submit(func, task)
                pool.append(t)

            for d in as_completed(pool):
                try:
                    response = d.result()
                    kwargs['message'] = f"IP: {response.data.get('ip')} {t_type} success!"
                    kwargs['collected_time'] = datetime.now().strftime(
                        '%Y-%m-%d %H:%M:%S')
                    kwargs['level'] = 3
                    _create_alarm_message(kwargs)

                except ValidationError as e:
                    kwargs['message'] = ','.join(
                        [f'{k}: {v[0]}' for k, v in e.detail.items()])
                    errMsg = kwargs['message']
                    kwargs['collected_time'] = datetime.now().strftime(
                        '%Y-%m-%d %H:%M:%S')
                    kwargs['level'] = 2
                    _create_alarm_message(kwargs)
                except Exception as e:
                    kwargs['message'] = str(e)
                    errMsg = kwargs['message']
                    kwargs['level'] = 2
                    kwargs['collected_time'] = datetime.now().strftime(
                        '%Y-%m-%d %H:%M:%S')
                    _create_alarm_message(kwargs)
        return {
            "success": True,
            "message": ""
        } if errMsg is None else {
            "success": False,
            "message": errMsg
        }

    def batch_add_host(self, request: Request):
        file = request.FILES.get('file', None)
        if not file:
            return other_response(message='Excel File Required!', code=400, success=False)
        e = Excel(file.read(), {
            'host_password': '主机密码',
            'hostname': '主机别名',
            'ip': '主机地址',
            'port': '端口',
            'username': '登录用户',
            'cluster': '所属集群',
            'description': '简介',
        })
        tasks = []

        kwargs = {
            "item": "host",
            "sub": 1
        }
        for row in e.values():
            cluster = self._get_cluster_instance(row['cluster'])
            if not cluster:
                kwargs.update({'level': 2})
                kwargs.update(
                    {'message': f"The cluster field {row['cluster']} of host {row['ip']} does not exist!"})
                kwargs.update({'collected_time': human_datetime()})
                _create_alarm_message(kwargs)
                continue
            row['cluster'] = cluster.id
            tasks.append(row)

        if len(tasks) > 0:
            self._thread_pool('add', tasks=tasks,
                              func=self._validate_and_initialize_host)
        return success(result={})

    def batch_del_host(self, request: Request):
        host_id_list = request.data.get('host_id_list', None)
        if not host_id_list:
            return other_response(message='host_id_list not found or list empty', code=400, success=False)
        if not isinstance(host_id_list, list):
            return other_response(message='host_id_list type is list', code=400)
        querysets = HostModel.objects.filter(id__in=host_id_list)
        self._thread_pool('del', querysets, func=self._destroy_host_tasks)
        return other_response(message='operation success!')

    def batch_export_host(self, request):
        host_id_list = request.data.get('host_id_list', None)
        if host_id_list is None:
            return other_response(code=400, message='host_id_list field required!')

        if not isinstance(host_id_list, list):
            return other_response(code=400, message='host_id_list field type list!')

        if len(host_id_list) == 0:
            return other_response(code=400, message='host_id_list field cannot be empty')

        queryset = HostModel.objects.filter(id__in=host_id_list)
        ser = serializer.HostSerializer(queryset, many=True)
        return Excel.export(ser.data, excelname='hostlist')

    def patch_host(self, request, host_ip, *args, **kwargs):
        status = request.data.get('status', None)
        if status is None:
            raise APIException(message='status required params!')

        if not self._validate_ip_format(host_ip):
            return other_response(code=400, message='ip不合法!', success=False)

        try:
            instance: HostModel = HostModel.objects.get(ip=host_ip)
            instance.status = status
            instance.save()
            return success(result={})
        except HostModel.DoesNotExist as e:
            raise APIException(message=f'Error: ip {host_ip} not exist!')

    def del_host(self, request, host_ip, *args, **kwargs):
        if not self._validate_ip_format(host_ip):
            return other_response(code=400, message='ip不合法!', success=False)
        try:
            instance: HostModel = HostModel.objects.get(ip=host_ip)
            instance.delete()
            return success(result={})
        except HostModel.DoesNotExist as e:
            raise APIException(message=f'Error: ip {host_ip} not exist!')

    def get_host(self, request, host_ip):
        if not self._validate_ip_format(host_ip):
            return other_response(code=400, message='ip不合法!', success=False)
        try:
            HostModel.objects.get(ip=host_ip)
            return success(result={})
        except HostModel.DoesNotExist:
            raise APIException(message=f'Error: ip {host_ip} not exist!')

    def _validate_ip_format(self, ip) -> bool:
        p = '((\d{1,2})|([01]\d{2})|(2[0-4]\d)|(25[0-5]))'
        pattern = '^' + '\.'.join([p]*4) + '$'
        return bool(re.match(pattern, ip))


class MetricsViewSet(CommonModelViewSet):
    authentication_classes = []

    #########################################################################
    # Used by Monitor API => Return prometheus format data
    #########################################################################
    def host_metrics(self, request):
        registry = CollectorRegistry()
        gauge_machines = Gauge(
            "sysom_api_host_machines",
            "Number of physical machines currently managed by SysOM",
            ['status'],
            registry=registry
        )
        gauge_clusters = Gauge(
            "sysom_api_host_clusters",
            "Number of clusters currently managed by SysOM",
            [],
            registry=registry
        )
        # Get machines
        host_count_set = HostModel.objects.values("status") \
            .annotate(status_count=Count("status"))
        for item in host_count_set:
            gauge_machines.labels(status=item['status']) \
                .set(item["status_count"])
        # Get Clusters
        gauge_clusters.set(Cluster.objects.count())

        return HttpResponse(generate_latest(registry))


class ClusterViewSet(CommonModelViewSet,
                     mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     mixins.DestroyModelMixin,
                     mixins.CreateModelMixin,
                     mixins.UpdateModelMixin):
    queryset = Cluster.objects.filter(Q(deleted_at=None) | Q(deleted_at=""))
    serializer_class = serializer.ClusterSerializer

    def get_authenticators(self):
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return success([], total=0)
        return super(ClusterViewSet, self).list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return success(result=response.data)

    def create(self, request, *args, **kwargs):
        res = self.require_param_validate(request, ["cluster_name"])
        if not res['success']:
            return ErrorResponse(msg=res['message'])
        super().create(request, *args, **kwargs)
        return success(result={}, message="新增成功")

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return success(result={}, message="修改成功")

    def destroy(self, request, *args, **kwargs):
        """
        判断当前集群是否包含主机，如果不包含主机则允许删除，如果包含主机则不允许删除
        """
        instance = self.get_queryset().filter(**kwargs).first()
        hostInstance = HostModel.objects.filter(cluster=instance.id).first()
        if hostInstance is None:
            # 允许删除
            super().destroy(request, *args, **kwargs)
            return success(result={}, message="删除成功")
        else:
            # 不允许删除
            return ErrorResponse(msg="Cluster has hosts, not allow to be delete.")

    def batch_add_cluster(self, request: Request):
        """
        集群批量导入
        """
        file = request.FILES.get('file', None)
        if not file:
            return other_response(message='Excel File Required!', code=400, success=False)
        e, fail_list, success_count = Excel(file.read(), {
            'cluster_name': '集群名称',
            'cluster_description': '集群描述',
        }), [], 0

        kwargs = {
            "item": "cluster",
            "sub": 1,
            "level": 2
        }

        for row in e.values():
            # 尝试创建并保存到数据库
            create_cluster_serializer = self.get_serializer(data=row)
            try:
                create_cluster_serializer.is_valid(raise_exception=True)
                create_cluster_serializer.save()
                success_count += 1
            except ValidationError as e:
                # 创建失败，记录一下
                fail_list.append(row['cluster_name'])
        if len(fail_list) > 0:
            kwargs.update(
                {'message': f"Batch import cluster [{', '.join(fail_list)}] failed!"})
            kwargs.update({'collected_time': human_datetime()})
            _create_alarm_message(kwargs)
        return success(result={
            "fail_list": fail_list,
            "success_count": success_count
        })

    def batch_del_cluster(self, request: Request):
        """
        集群批量删除
        """
        cluster_id_list = request.data.get('cluster_id_list', None)
        if not cluster_id_list:
            return other_response(message='host_id_list not found or list empty', code=400, success=False)
        if not isinstance(cluster_id_list, list):
            return other_response(message='host_id_list type is list', code=400)
        querysets = Cluster.objects.filter(id__in=cluster_id_list)
        kwargs = {
            "item": "cluster",
            "sub": 1,
            "level": 2
        }

        fail_list, success_count = [], 0
        for instance in querysets:
            hostInstance = HostModel.objects.filter(
                cluster=instance.id).first()
            if hostInstance is None:
                # 不包含主机，执行删除
                self.perform_destroy(instance)
                success_count += 1
            else:
                # 包含主机不允许删除
                kwargs.update(
                    {'message': f"Cluster（{instance.cluster_name}） contains hosts, delete failed!"})
                kwargs.update({'collected_time': human_datetime()})
                _create_alarm_message(kwargs)
                fail_list.append(instance.cluster_name)
        return other_response(message='operation success!', result={
            "fail_list": fail_list,
            "success_count": success_count
        })


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
