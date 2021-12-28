import os
import uuid
import ast
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins

from django.conf import settings
from apps.accounts.authentication import Authentication
from apps.task import seriaizer
from apps.task.models import JobModel, ServiceModel
from apps.host.models import HostModel
from apps.accounts.models import User
from consumer.executors import SshJob
from lib import *



class JobAPIView(GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    queryset = JobModel.objects.all()
    serializer_class = seriaizer.JobListSerializer
    authentication_classes = []

    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.filter(created_by=self.request.user)
        queryset = queryset.filter(deleted_at=None)
        return queryset

    def get_object(self):
        pass

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return success(result=response.data)


class TaskAPIView(GenericViewSet,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin,
                  mixins.CreateModelMixin
                  ):
    queryset = JobModel.objects.filter(deleted_at=None)
    serializer_class = seriaizer.JobListSerializer
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            service_name = data.get("service_name", None)
            task_id = uuid_8()
            if service_name:
                sercive = ServiceModel.objects.filter(service_name=service_name).first()
                SCRIPTS_DIR = settings.SCRIPTS_DIR
                service_path = os.path.join(SCRIPTS_DIR, sercive.service_script)
                data["taskid"] = task_id
                command = "/bin/bash  %s  %s" % (service_path, json.dumps(data))
                output = os.popen(command)
                resp = ast.literal_eval(output.read())
                resp_scripts = resp.get("commands")
                username = "admin"
                user = User.objects.filter(username=username).first()
                job_id = str(uuid.uuid4())
                self.ssh_job(resp_scripts, task_id, user, job_id)
                return success(result={"instance_id": task_id})
            else:
                return self.default_ssh_job(data, task_id)
        except Exception as e:
            logger.error(e)
            return other_response(message=str(e), code=400)

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return success(result=response.data)

    def default_ssh_job(self, data, task_id):
        try:
            host_ids = data.get("host_ids")
            commands = data.get("command")
            if not host_ids:
                return other_response(message="请选择执行主机", code=400)
            user = User.objects.filter(username='admin').first()
            job_id = str(uuid.uuid4())
            cmds = []
            for i in range(len(host_ids)):
                instance = {}
                host = HostModel.objects.filter(pk=host_ids[i]).first()
                instance["instance"] = host.ip
                instance["cmd"] = commands[i]
                cmds.append(instance)
            self.ssh_job(cmds, task_id, user, job_id)
            return success(result={"instance_id": task_id})
        except Exception as e:
            logger.error(e)
            return other_response(message=str(e), code=400)

    def ssh_job(self, resp_scripts, task_id, user, job_id):
        job_model = JobModel.objects.create(command=resp_scripts, task_id=task_id,
                                            created_by=user)
        sch_job = SshJob(resp_scripts, job_model)
        scheduler.add_job(sch_job.run, id=job_id, )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return not_found()
        self.perform_destroy(instance)
        return success(message="删除成功", code=200, result={})

    def perform_destroy(self, instance: JobModel):
        instance.deleted_at = human_datetime()
        instance.deleted_by = self.request.user
        instance.save()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return success(result=response.data, message="修改成功")

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        return success(result=response.data, message="修改成功")


class ServiceAPIView(GenericViewSet,
                     mixins.ListModelMixin,
                     mixins.RetrieveModelMixin,
                     mixins.UpdateModelMixin,
                     mixins.DestroyModelMixin,
                     mixins.CreateModelMixin,
                     ):
    queryset = ServiceModel.objects.all()
    serializer_class = seriaizer.ServiceSerializer
    authentication_classes = []
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["id", "service_name"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success(result={})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return not_found()
        self.perform_destroy(instance)
        return success(message="删除成功", code=200, result={})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_queryset().filter(**kwargs).first()
        if not instance:
            return not_found()
        ser = self.get_serializer(instance)
        return success(result=ser.data)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return success(result=response.data, message="修改成功")

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        return success(result=response.data.get("data"), message="修改成功")
