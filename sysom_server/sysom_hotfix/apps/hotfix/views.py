from loguru import logger
import re
import logging
import os
import threading
import time
from typing import Any
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework import mixins
from django.db.models import Q
from django.db.models.functions import Concat
from django.db.models import Value
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import ValidationError
from django.conf import settings
from rest_framework.viewsets import GenericViewSet
import re

from apps.hotfix import serializer
from apps.hotfix.models import HotfixModel, OSTypeModel, KernelVersionModel
from lib.response import *
from lib.utils import human_datetime, datetime
from lib.exception import APIException
from lib.base_view import CommonModelViewSet
from concurrent.futures import ThreadPoolExecutor, as_completed
from channel_job import default_channel_job_executor
from channel_job import ChannelJobExecutor
from django import forms
from django.views.decorators.csrf import csrf_exempt
from cec_base.admin import dispatch_admin
from cec_base.producer import dispatch_producer
from cec_base.event import Event
from django.http import HttpResponse, FileResponse
from apps.hotfix.function import FunctionClass


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
        patch_file = request.data.get('file', None)
        catalogue = request.data.get('catalogue', None)
        if not patch_file:
            return APIException(message="Upload Failed: file required!")

        patch_file_repo = os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, "patch")
        if not os.path.exists(patch_file_repo):
            os.makedirs(patch_file_repo)
        file_path = os.path.join(patch_file_repo, patch_file.name)

        try:
            with open(file_path, 'wb') as f:
                for chunk in patch_file.chunks():
                    f.write(chunk)
        except Exception as e:
            logger.error(e)
            raise APIException(message=f"Upload Failed: {e}")
        return success(result={}, message="Upload success")


class HotfixAPIView(GenericViewSet,
                   mixins.ListModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.CreateModelMixin,
                   mixins.UpdateModelMixin,
                   mixins.DestroyModelMixin
                   ):
    queryset = HotfixModel.objects.filter(deleted_at=None)
    serializer_class = serializer.HotfixSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['created_at', 'creator', 'building_status', 'arch']
    http_method_names = ['get', 'post', 'patch', 'delete']

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.event_id = None
        self.function = FunctionClass()
        self.cec = CommonModelViewSet()

    """
    Log_file : patch_name-time.log , this is used to output the log
    """
    def create_hotfix(self, request, **kwargs):
        arch = request.data['kernel_version'].split(".")[-1]
        log_file = "{}-{}.log".format(request.data["patch_name"], time.strftime("%Y%m%d%H%M%S"))
        patch_name = request.data["patch_name"]
        patch_name.replace(" ","-")
        kernel_version = request.data['kernel_version']

        # check if this kernel_version is customize
        try:
            customize_version_object = KernelVersionModel.objects.all().filter(kernel_version=kernel_version).first()
        except Exception as e:
            return other_response(message="Error when operating db", code=400)

        if customize_version_object is None:
            # This is not a customize kernel version
            release = kernel_version.split('.')[-2] # 4.19.91-26.5.an8.x86_64 -> an8
            if re.search('an', release):
                # this is a anolis kernel
                os_type = "anolis"
                patch_path = os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, request.data['upload'].split("\\")[-1])
                hotfix_necessary = 0
                hotfix_risk = 2
                res = self.function.create_hotfix_object_to_database(os_type, kernel_version, patch_name, patch_path, 
                hotfix_necessary, hotfix_risk, log_file, arch)

                status = self.function.create_message_to_cec(customize=False, cec_topic=settings.SYSOM_CEC_HOTFIX_TOPIC, os_type=os_type, 
                hotfix_id=res.id, kernel_version=res.kernel_version, patch_name=res.patch_name, patch_path=res.patch_path, 
                arch=res.arch, log_file=res.log_file)
        else:
            # This is a customize kernel version
            os_type = self.function.get_info_from_version(kernel_version)
            git_repo = self.function.get_gitrepo_of_os(os_type)
            image = self.function.get_image_of_os(os_type)
            git_branch = self.function.get_info_from_version(kernel_version, "branch")
            devel_link = self.function.get_info_from_version(kernel_version, "devel_link")
            debuginfo_link = self.function.get_info_from_version(kernel_version, "debuginfo_link")
            patch_path = os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, request.data['upload'].split("\\")[-1])
            hotfix_necessary = 0
            hotfix_risk = 2
            res = self.function.create_hotfix_object_to_database(os_type, kernel_version, patch_name, patch_path,
            hotfix_necessary, hotfix_risk, log_file, arch)

            # if this is customize kernel, it should provide the git repo and the branch of this version
            # with devel-package and debuginfo-package
            status = self.function.create_message_to_cec(customize=True, cec_topic=settings.SYSOM_CEC_HOTFIX_TOPIC, os_type=res.os_type,
            hotfix_id=res.id, kernel_version=res.kernel_version, patch_name=res.patch_name, patch_path=res.patch_path, arch=res.arch,
            log_file=res.log_file, git_repo=git_repo, git_branch=git_branch, devel_link=devel_link,debuginfo_link=debuginfo_link,image=image)
            
        return success(result={"msg":"success","id":res.id,"event_id":self.event_id}, message="create hotfix job success")

    def get_hotfixlist(self, request):
        try:
            queryset = HotfixModel.objects.all().filter(deleted_at=None)
            response = serializer.HotfixSerializer(queryset, many=True)
        except Exception as e:
            logger.exception(e)
            return other_response(message=str(e), result={"msg":"invoke get_hotfixlist failed"}, code=400)
        return success(result=response.data, message="invoke get_hotfixlist")

    """
    return the formal hotfix information list base on the given parameters
    """
    def get_formal_hotfixlist(self, request):
        try:
            created_time = request.GET.get('created_at')
            kernel_version = request.GET.get('kernel_version')
            patch_name = request.GET.get('patch_name')
            queryset = self.function.query_formal_hotfix_by_parameters(created_time, kernel_version, patch_name)
            response = serializer.HotfixSerializer(queryset, many=True)
        except Exception as e:
            logger.exception(e)
            return other_response(message=str(e), result={"msg":"invoke get_formal_hotfixlist failed"}, code=400)
        return success(result=response.data, message="invoke get_formal_hotfixlist")  


    def delete_hotfix(self, request):
        hotfix = HotfixModel.objects.filter(id=request.data["id"],deleted_at=None).first()
        if hotfix is None:
            return other_response(message="can not delete this hotfix", result={"msg":"Hotfix not found"}, code=400)
        else:
            hotfix.deleted_at=human_datetime()
            hotfix.save()
            return success(result={}, message="invoke delete_hotfix")

    def set_formal(self, request):
        hotfix = HotfixModel.objects.filter(id=request.data["id"]).first()
        hotfix.formal = 1
        hotfix.save()
        return success(result={"msg":"scuuessfully update formal status"}, message="formal status updated")

    def update_building_status(self, request):
        hotfix = HotfixModel.objects.filter(id=request.data["id"]).first()
        status = request.data["status"]
        if hotfix is None:
            return other_response(message="No such hotfix id", result={"mgs":"update building status failed"}, code=400)
        if status == "waiting":
            hotfix.building_status=0
        elif status == "building":
            hotfix.building_status=1
        elif status == "failed":
            hotfix.building_status=2
        elif status == "success":
            hotfix.building_status=3
        else:
            return other_response(message="unsupported status", result={"mgs":"update building status failed"}, code=401)
        hotfix.save()
        return success(result={"msg":"update building status successfully"}, message="update building status success")

    def get_build_log(self, request):
        hotfix_id = request.GET.get('id')
        hotfix = HotfixModel.objects.filter(id=hotfix_id).first()
        if hotfix:
            if hotfix.building_status == 2 or hotfix.building_status == 3:
                # this hotfix task is finished
                if os.path.exists(os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, "log", hotfix.log_file)):
                    msg = ""
                    for line in open(os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, "log", hotfix.log_file)):
                        msg += line
                    hotfix.log = msg
                    hotfix.save()
                    return success(result=msg, message="hotfix build log return")
                else:
                    msg = hotfix.log

                if len(msg) > 0:
                    return success(result=msg, message="hotfix build log return")
                else:
                    return other_response(message="No build log found", result={"msg":"No build log found"}, code=400) 
            else:
                # this job is not finished.. read from the log file
                msg = ""
                for line in open(os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, "log", hotfix.log_file)):
                    msg += line
                return success(result=msg, message="hotfix build log return")
        else:    
            return other_response(message="No such record", result={"msg":"Hotfix not found"}, code=400)

    def insert_building_log(self, request):
        hotfix = HotfixModel.objects.filter(id=request.data["id"]).first()
        log = request.data["log"]
        if hotfix is None:
            return other_response(message="No such hotfix id", result={"mgs":"insert build log failed"}, code=400)
        if len(log) <= 0:
            return other_response(message="log is blank", result={"mgs":"insert build log failed"}, code=400)
        build_log = hotfix.log
        build_log = build_log + log
        hotfix.log = build_log
        hotfix.save()
        return success(result={"msg": "inserted hotfix log"}, message="insert build log success")

    # this function is invoked when job finished..
    def sync_build_log(self, request):
        success = False
        hotfix = HotfixModel.objects.filter(id=request.data["id"]).first()
        try:
            log = ""
            for line in open(os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, "log", hotfix.log_file)):
                log = log + str(line)
            hotfix.log = log
            hotfix.save()
        except Exception as e:
            return other_response(message=str(e), code=400)
        return success(result={"msg": "SUCCESS"}, message="sync build log success")

    def update_hotfix_name(self, request):
        try:
            hotfix = HotfixModel.objects.filter(id=request.data["id"]).first()
            rpm_name = request.data["rpm"]
            hotfix.rpm_name += rpm_name 
            hotfix.save()
        except Exception as e:
            return other_response(message=str(e), code=400)
        return success(result={"msg":"update hotfix name success"}, message="updated hotfix name")

    def download_hotfix_file(self, request):
        try:
            hotfix_id = request.GET.get('id')
            hotfix = HotfixModel.objects.filter(id=hotfix_id).first()
            rpm_name = hotfix.rpm_name
            response = FileResponse(open(os.path.join(settings.HOTFIX_FILE_STORAGE_REPO, "rpm", rpm_name), "rb"), as_attachment=True)
            response['content_type'] = "application/octet-stream"
            response['Content-Disposition'] = 'attachment;filename=' + rpm_name
            return response
        except Exception as e:
            logger.exception(e)
            return other_response(message=str(e), code=400)

    def insert_os_type_relation(self, request):
        os_type = request.data["os_type"]
        git_repo = request.data["git_repo"]
        try:
            image = request.data['image']
        except Exception as e:
            image = ""
        if len(os_type) > 0 and len(git_repo) > 0:
            try:
                os_object = OSTypeModel.objects.all().filter(os_type=os_type).first()
                if os_object is None:
                    os_type_object = OSTypeModel.objects.create(
                        os_type = os_type,
                        git_repo = git_repo,
                        image = image
                    )
                else:
                    return other_response(message="same key found in record..", code=400)
            except Exception as e:
                return other_response(message=str(e), code=400)
        else:
            return other_response(message="one or more of the key parameter is null", code=400)
        return success(result={"msg":"create os_type relation successfully"}, message="invoke insert_os_type_relation success")

    def insert_kernel_version_relation(self, request):
        kernel_version = request.data['kernel_version']
        git_branch = request.data['git_branch']
        devel_link = request.data['devel_link']
        debuginfo_link = request.data['debuginfo_link']
        os_type = request.data['os_type']
        if len(kernel_version)>0 and len(git_branch)>0 and len(devel_link)>0 and len(debuginfo_link)>0:
            try:
                kernel_object = KernelVersionModel.objects.all().filter(kernel_version=kernel_version).first()
                if kernel_object is None:
                    kernel_object = KernelVersionModel.objects.create(
                        kernel_version = kernel_version,
                        os_type=os_type,
                        git_branch = git_branch,
                        devel_link = devel_link,
                        debuginfo_link = debuginfo_link
                    )
                else:
                    return other_response(message="same kernel version found in record...")
            except Exception as e:
                return other_response(message=str(e), code=400)
        else:
            return other_response(message="one or more of the key parameters is null", code=400)
        return success(result={"msg":"create kernel version relation successfully"}, message="invoke insert_kernel_version_relation success")

    def get_os_type_relation(self, request):
        try:
            queryset = OSTypeModel.objects.all().filter(deleted_at=None)
            response = serializer.OSTypeSerializer(queryset, many=True)
        except Exception as e:
            print(str(e))
            return other_response(message=str(e), result={"msg":"get_os_type_relation failed"}, code=400)
        return success(result=response.data, message="get_os_type_relation")
    
    def get_kernel_relation(self, request):
        try:
            queryset = KernelVersionModel.objects.all().filter(deleted_at=None)
            response = serializer.KernelSerializer(queryset, many=True)
        except Exception as e:
            print(str(e))
            return other_response(message=str(e), result={"msg":"get_kernel_relation failed"}, code=400)
        return success(result=response.data, message="get_kernel_relation")

    def delete_os_type(self, request):
        object_id = request.data['id']
        try:
            os_type_object = OSTypeModel.objects.all().filter(id=object_id).first()
            if os_type_object is not None:
                os_type = os_type_object.os_type
                kernel_sets = KernelVersionModel.objects.all().filter(os_type=os_type)
                # delete all the kernel belongs to the delete os_type
                for each_kernel in kernel_sets:
                    each_kernel.delete()
                os_type_object.delete()
            else:
                other_response(message="can not find the record with the given id", code=400)
        except Exception as e:
            return other_response(message=str(e), code=400)
        return success(result={"msg":"successfully deleted object"}, message="invoked delete os type")

    def delete_kernel_version(self, request):
        object_id = request.data['id']
        try:
            os_type_object = KernelVersionModel.objects.all().filter(id=object_id).first()
            if os_type_object is not None:
                os_type_object.delete()
            else:
                other_response(message="can not find the record with the given id", code=400)
        except Exception as e:
            return other_response(message=str(e), code=400)
        return success(result={"msg":"successfully deleted object"}, message="invoked delete kernel_version")

    def update_kernel_version(self, request):
        print(request.data)
        try:
            kernel_object = KernelVersionModel.objects.all().filter(id=request.data['id']).first()
            if kernel_object is None:
                return other_response(msg="can not find the kernelversion record", code=400)
            kernel_object.kernel_version = request.data['kernel_version']
            kernel_object.os_type = request.data['os_type']
            kernel_object.git_branch = request.data['git_branch']
            kernel_object.devel_link = request.data['devel_link']
            kernel_object.debuginfo_link = request.data['debuginfo_link']
            kernel_object.save()
        except Exception as e:
            return other_response(msg=str(e), code=400)
        return success(result={"msg":"successfully update kernelversion object"},message="invoke update_kernelversion")

    def update_ostype(self, request):
        try:
            os_type_object = OSTypeModel.objects.all().filter(id=request.data['id']).first()
            if os_type_object is None:
                return other_response(msg="can not find the OS type record", code=400)
            os_type_object.os_type = request.data['os_type']
            os_type_object.git_repo = request.data['git_repo']
            os_type_object.image = request.data['image']
            os_type_object.save()
        except Exception as e:
            return other_response(msg=str(e), code=400)
        return success(result={"msg":"successfully update os_type object"},message="invoke update_ostype")
