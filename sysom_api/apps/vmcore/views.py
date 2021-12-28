import logging
from django.shortcuts import render
from drf_yasg.utils import swagger_auto_schema
from rest_framework.request import Request
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsAdminPermission, IsOperationPermission
from apps.accounts.serializer import UserAuthSerializer
from apps.accounts.authentication import Authentication
from . import models
from . import serializer
from lib import success, other_response
import datetime
import re

logger = logging.getLogger(__name__)



# Create your views here.
class VmcoreViewSet(GenericViewSet,
                       mixins.ListModelMixin,
                       mixins.RetrieveModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.CreateModelMixin,
                       mixins.DestroyModelMixin
                       ):
    queryset = models.Panic.objects.filter(deleted_at=None)
    serializer_class = serializer.PanicListSerializer
    authentication_classes = [Authentication]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['hostname', 'calltrace', 'id', 'name', 'ver']
    
    def get_queryset(self):
        data = self.request.GET.dict()
        start_time = data.get("startTime", None) or "2021-01-01"
        end_time = data.get('endTime', None) or datetime.datetime.now()
        return models.Panic.objects.filter(core_time__range=(start_time, end_time))


    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializer.PanicListSerializer
        else:
            return serializer.AddPanicSerializer
        
    def get_authenticators(self):
        return []
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]
    def create(self, request, *args, **kwargs):
        data = request.data
        if 'similar_dmesg' in data:
            #TODO match similar vmcore
            dmesg = data.get('similar_dmesg')
            data = self.parse_calltrace(dmesg)
            return other_response(result=data)
        response = super().create(request, *args, **kwargs)
        data = response.data
        vmcore_id = data['id']
        vmcore_calltrace = data['calltrace']
        vmcores = models.Panic.objects.filter(calltrace=vmcore_calltrace).exclude(id=vmcore_id)
        for vmcore in vmcores:
            if vmcore.issue_id != 0:
                insert_vmcore = models.Panic.objects.filter(id=vmcore_id)
                insert_vmcore = insert_vmcore[0]
                insert_vmcore.issue_id = vmcore.issue_id
                insert_vmcore.save()
                break
        return success(result=response.data, message="插入成功")

    def list(self, request, *args, **kwargs):
        data_get = self.request.GET.dict()
        if 'vmcore_id' in data_get and 'similar' in data_get and data_get.get('similar') == '1':
            vmcore_id = data_get.get('vmcore_id')
            vmcore = models.Panic.objects.filter(id=vmcore_id)
            if len(vmcore) == 0:
                return other_response(message="没有制定的vmcore", code=400, success=False)
            vmcore = vmcore[0]
            data = {}
            data['calltrace_1'] = []
            data['calltrace_2'] = []
            data['calltrace_3'] = []

            if vmcore.calltrace == '' or vmcore.calltrace == None:
                return other_response(result=data)

            calltrace_3 = vmcore.calltrace
            calltracelist = calltrace_3.split('$')
            if len(calltracelist) < 3:
                calltrace_3 = ''
            if len(calltracelist) >= 2:
                calltrace_2 = '$'.join(calltracelist[0:2])
            else:
                calltrace_2 = ''
            calltrace_1 = calltracelist[0]

            if calltrace_3 != '':
                vmcores = models.Panic.objects.filter(calltrace=calltrace_3).exclude(id=vmcore.id)
                for i in vmcores:
                    data['calltrace_3'].append(serializer.PanicListSerializer(i).data)
            if calltrace_2 != '':
                vmcores = models.Panic.objects.filter(calltrace__startswith=calltrace_2).exclude(calltrace=calltrace_3)
                for i in vmcores:
                    data['calltrace_2'].append(serializer.PanicListSerializer(i).data)
            if calltrace_1 != '':
                vmcores = models.Panic.objects.filter(calltrace__startswith=calltrace_1).exclude(calltrace__startswith=calltrace_2).exclude(calltrace=calltrace_3)
                for i in vmcores:
                    data['calltrace_1'].append(serializer.PanicListSerializer(i).data)
            return other_response(result=data)
        else:
            data = super().list(request, *args, **kwargs).data

        #if len(data_get) == 0:
        if 'hostname' not in data_get and 'start_time' not in data_get and 'end_time' not in data_get and 'vmcore_id' not in data_get and 'similar' not in data_get and 'similar_dmesg' not in data_get :
            end_time=datetime.date.today() + datetime.timedelta(days=1)
            start_time=end_time + datetime.timedelta(days=-30)

            host_sum = models.Panic.objects.values('hostname').distinct().count()
            if host_sum == 0:
                return success(result=data['data'], total=data['total'], success=True, vmcore_30days=0, vmcore_7days=0, rate_30days=0, rate_7days=0)
            vmcores_sum_30 = models.Panic.objects.filter(core_time__range=(start_time,end_time)).count()
            hosts_sum_30 = models.Panic.objects.filter(core_time__range=(start_time,end_time)).count()

            start_time=end_time + datetime.timedelta(days=-7)
            vmcores_sum_7 = models.Panic.objects.filter(core_time__range=(start_time,end_time)).values('hostname').distinct().count()
            hosts_sum_7 = models.Panic.objects.filter(core_time__range=(start_time,end_time)).values('hostname').distinct().count()

            rate_30 = hosts_sum_30 / host_sum
            rate7 = hosts_sum_7 /host_sum
            data['vmcore_30days'] = vmcores_sum_30
            data['vmcore_7days'] = vmcores_sum_7
            data['rate_30days'] = hosts_sum_30/host_sum
            data['rate_7days'] = hosts_sum_7/host_sum
            return success(result=data['data'], total=data['total'], success=True, vmcore_30days=vmcores_sum_30, vmcore_7days=vmcores_sum_7, rate_30days=hosts_sum_30/host_sum, rate_7days=hosts_sum_7/host_sum)
        return success(result=data['data'], success=True)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        u_serializer = self.get_serializer(instance, data=request.data, partial=partial)
        u_serializer.is_valid(raise_exception=True)
        self.perform_update(u_serializer)

        result = serializer.PanicListSerializer(instance=u_serializer.instance, many=False)
        return success(result=result.data, message="修改成功")

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return success(result={}, message="删除成功")


    def match_idx(self, list2, fstr):
        i = 0
        for x in list2:
            if x == fstr:
                return i
            i = i + 1
        return -1


    def parse_calltrace(self,dmesg):
        if len(dmesg) <= 0:
            return []
        result=[]
        list2=[]
        line_pattern1 = re.compile(r'.+[0-9]+\].+\[.*\][? ]* (\S+)\+0x')
        line_pattern2 = re.compile(r'.+[0-9]+\][? ]*(\S+)\+0x')
        line_pattern3 = re.compile(r'.*#[0-9]+ \[[0-9a-f]+\] (\S+) at')
        lines = dmesg.split('\n')
        if len(lines) == 1:
            lines = dmesg.splitlines()
        for r in lines:
            if r.find("Call Trace:") > 0 or r.find("exception RIP:") > 0:
                del list2[:]

            m = line_pattern1.match(r)
            if m:
                list2.append(m.group(1))
                continue

            m = line_pattern2.match(r)
            if m:
                list2.append(m.group(1))
                continue

            m = line_pattern3.match(r)
            if m:
                list2.append(m.group(1))
                continue

        s2=len(list2)
        while s2 > 0:
            vmcore_names = models.Calltrace.objects.filter(line__in=list2).order_by('name','idx')

            last_name = None
            last_idx=0
            fidx=-1
            fcnt=0
            fpow=1
            for calltrace_set in vmcore_names:
                if last_name == None or last_name.name!=calltrace_set.name:
                    if fcnt > 1:
                        data = serializer.PanicListSerializer(last_name.vmcore).data
                        data['rate'] = (fcnt*100/s2)+fpow
                        result.append(data)
                        #result[last_name]=(fcnt*100/s2)+fpow
                    last_idx=0
                    fidx=-1
                    fidx=self.match_idx(list2, calltrace_set.line)
                    fcnt=0
                    fpow=0
                    if fidx >= 0:
                        fcnt=1
                    if fidx == 0 and calltrace_set.idx <= 2:
                        fpow=100
                elif (last_idx>=calltrace_set.idx-2 and last_idx<=calltrace_set.idx-1) and fidx>=0 and fidx<=s2-1:
                    if list2[fidx+1]==calltrace_set.line:
                        fidx=fidx+1
                        fcnt=fcnt+1
                last_name=calltrace_set
                last_idx=calltrace_set.idx
            if fcnt > 1:
                data = serializer.PanicListSerializer(calltrace_set.vmcore).data
                data['rate'] = (fcnt*100/s2)+fpow
                result.append(data)
            if len(result) > 0:
                break
            list2=list2[1:]
            s2=len(list2)

        l = sorted(result, key=lambda x:x['rate'], reverse=True)
        s = len(l)
        if s >= 20:
            s = 20
        l = l[0:s]
        return l


class IssueModelViewSet(GenericViewSet,
                       mixins.CreateModelMixin,
                       mixins.ListModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.RetrieveModelMixin):
    queryset = models.Issue.objects.filter(deleted_at=None)
    serializer_class = serializer.IssueSerializer
    authentication_classes = [Authentication]
    permission_classes = [IsAdminPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id']

    def get_queryset(self):
        data = self.request.GET.dict()
        if 'issue_id' in data:
            return models.Issue.objects.filter(id=data['issue_id'])
        elif 'vmcore_id' in data:
            vmcore = models.Panic.objects.filter(id=data['vmcore_id'])
            if len(vmcore) == 0:
                return models.Issue.objects.filter(deleted_at=None)
            issue_id = vmcore[0].issue_id
            return models.Issue.objects.filter(id=issue_id)
        else:
            return models.Issue.objects.filter(deleted_at=None)

    def get_serializer_class(self):
        if self.request.method == "GET":
            return serializer.IssueSerializer
        else:
            return serializer.AddIssueSerializer

    def get_permissions(self):
        return []
        if self.request.method == "GET":
            return []
        else:
            return [permission() for permission in self.permission_classes]

    def get_authenticators(self):
        return []
        if self.request.method == "GET":
            return []
        else:
            return [auth() for auth in self.authentication_classes]

    def retrieve(self, request, *args, **kwargs):
        result = super().retrieve(request, *args, **kwargs)
        return success(result=result.data)

    def create(self, request, *args, **kwargs):
        vmcore_id = request.data.get('vmcore_id')
        issue = {}
        issue['solution'] = request.data.get('solution')
        vmcore = models.Panic.objects.filter(id=vmcore_id)
        if len(vmcore) == 0:
            return other_response(message="没有指明vmcore，无法提交", code=400)
        vmcore = vmcore[0]
        if vmcore.issue_id == 0:
            issue['calltrace'] = vmcore.calltrace
            issue['crashkey'] = vmcore.crashkey
            create_serializer = self.get_serializer(data=issue)
            create_serializer.is_valid(raise_exception=True)
            self.perform_create(create_serializer)
        else:
            issue_old = models.Issue.objects.filter(id=vmcore.issue_id)
            issue_old = issue_old[0]
            issue_old.solution = issue['solution']
            issue_old.save()
            create_serializer = self.get_serializer(issue_old)


        instance = create_serializer.instance
        vmcore.issue_id = instance.id
        vmcore.status = 4
        vmcore.save()
        vmcores = models.Panic.objects.filter(calltrace=vmcore.calltrace)
        if vmcores:
            for vmcore in vmcores:
                vmcore.issue_id = instance.id
                vmcore.status = 4
                vmcore.save()

        ser = serializer.IssueSerializer(instance=create_serializer.instance, many=False)
        return other_response(result=ser.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        u_serializer = self.get_serializer(instance, data=request.data, partial=partial)
        u_serializer.is_valid(raise_exception=True)
        self.perform_update(u_serializer)
        result = serializer.IssueSerializer(instance=u_serializer.instance, many=False)
        return success(message="修改成功", result=result.data)


class VmcoreDetail(APIView):
    authentication_classes = []
    def get(self, request):
        try:
            data = request.GET.dict()
            if 'vmcore_name' not in data and 'vmcore_id' not in data:
                return other_response(message='vmcore_name or vmcore_id 不能为空', code=400, result={})
            if 'vmcore_name' in data:
                vmcore_name = data.get('vmcore_name')
                vmcore = models.Panic.objects.filter(name=vmcore_name)
            else:
                vmcore_id = data.get('vmcore_id')
                vmcore = models.Panic.objects.filter(id=vmcore_id)
            if len(vmcore) == 0:
                return other_response(code=200)
            vmcores_data = serializer.PanicDetailSerializer(vmcore[0]).data
            return success(result=vmcores_data)
        except Exception as e:
            logger.error(e)
            return other_response(message=str(e), code=400)
