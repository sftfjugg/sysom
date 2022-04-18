import logging
import re
import time
import requests
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework import viewsets
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import register_job

from tzlocal import get_localzone
from django.utils.timezone import localdate, localtime
from django_filters.rest_framework import DjangoFilterBackend
from lib.response import *
from apps.accounts.authentication import Authentication
from apps.vul.models import *
from apps.vul.vul import update_sa as upsa, update_vul as upvul
from apps.vul.vul import fix_cve, get_unfix_cve
from apps.vul.serializer import VulAddrListSerializer, VulAddrModifySerializer

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=f'{get_localzone()}')


@register_job(scheduler, 'cron', id='update_vul', hour=0, minute=0)
def update_vul():
    upvul()


@register_job(scheduler, 'cron', id='update_sa', hour=2, minute=0)
def update_sa():
    upsa()


scheduler.start()


class VulListView(APIView):
    authentication_classes = [Authentication]

    def get(self, request, format=None):
        """
        Return a list of all users.
        """
        cves = SecurityAdvisoryModel.objects.exclude(host=None)
        cves_data = {}
        for cve in cves:
            cve_id = cve.cve_id
            if cves_data.get(cve_id):
                hosts = [host[0] for host in cve.host.all().values_list("hostname")]
                cves_data[cve_id]["hosts"] += hosts

            else:
                vul_level = cve.vul_level
                score = cve.score
                description = cve.description
                detail = cve.detail
                pub_time = cve.pub_time
                hosts = [host[0] for host in cve.host.all().values_list("hostname")]
                cves_data[cve_id] = {
                    "cve_id": cve_id,
                    "vul_level": vul_level,
                    "score": score,
                    "description": str(description),
                    "detail": detail,
                    "pub_time": pub_time,
                    "hosts": hosts,
                }
        data = list(cves_data.values())
        return success(result=data)

    def post(self, request, format=None):
        logger.debug(request.user)
        failed = False
        data = []
        for cve in request.data.get("cve_id_list"):
            hosts = cve["hostname"]
            cve_id = cve["cve_id"]
            results = fix_cve(hosts, cve_id, user=request.user)
            logger.debug(results)
            sucess_host_list = []
            fail_host_list = []
            for ret in results:
                hostname = ret["host"]
                if ret["ret"]["status"] == 0:
                    sucess_host_list.append(hostname)
                else:
                    failed = True
                    fail_host_list.append({
                        "hosts": hostname,
                        "describe": str(ret["ret"]["result"])
                    })
            data.append({
                "cve_id": cve_id,
                "sucess_host_list": sucess_host_list,
                "fail_host_list": fail_host_list
            })
        logger.debug(data)
        if failed:
            return other_response(message='fix cve failed', code=200, result=data)
        else:
            return success(result=data)


class VulDetailsView(APIView):
    authentication_classes = [Authentication]

    def get(self, request, cve_id, format=None):
        """
        Return a list of all users.
        """
        cve_re = "CVE-\d{4}-\d{4,7}"
        if re.match(cve_re, cve_id, re.I) is None:
            other_response(message='Illegal parameter', code=400)
        cves = SecurityAdvisoryModel.objects.exclude(host=None).filter(cve_id=cve_id)
        cves_data = {}
        flag = False
        for cve in cves:
            cve_id = cve.cve_id
            vul_level = cve.vul_level
            if flag:
                software_name = cve.software_name
                fixed_version = cve.fixed_version
                hosts = [self.get_host_info(host[0]) for host in cve.host.all().values_list("hostname")]
                cves_data["software"].append({
                    "name": software_name,
                    "vul_level": vul_level,
                    "fixed_version": fixed_version
                })
                cves_data["software"] = [dict(t) for t in set([tuple(d.items()) for d in cves_data["software"]])]
                cves_data["hosts"] += hosts

            else:
                flag = True
                score = cve.score
                description = cve.description
                detail = cve.detail
                pub_time = cve.pub_time
                software_name = cve.software_name
                fixed_version = cve.fixed_version
                hosts = [self.get_host_info(host[0]) for host in cve.host.all().values_list("hostname")]
                cves_data = {
                    "cve_id": cve_id,
                    "vul_level": vul_level,
                    "score": score,
                    "description": str(description),
                    "detail": detail,
                    "pub_time": pub_time,
                    "hosts": hosts,
                    "software": [{
                        "name": software_name,
                        "vul_level": vul_level,
                        "fixed_version": fixed_version
                    }]
                }
        data = cves_data
        return success(result=data)

    def get_host_info(self, hostname):
        host = HostModel.objects.filter(hostname=hostname).first()
        return {
            "hostname": hostname,
            "ip": host.ip,
            "created_by": host.created_by.username,
            "created_at": host.created_at,
            "status": host.get_status_display(),
        }


class VulSummaryView(APIView):
    authentication_classes = [Authentication]

    def get(self, request, format=None):
        """
        """
        sa = SecurityAdvisoryModel.objects.exclude(host=None)
        sa_cve_count, sa_high_cve_count, sa_affect_host_count = self.get_vul_info(sa)
        unfix_vul = get_unfix_cve().exclude(host=None)
        vul_cve_count, vul_high_cve_count, vul_affect_host_count = self.get_vul_info(unfix_vul)

        try:
            latest_scan_time = localtime(
                VulJobModel.objects.filter(job_name="update_sa").order_by(
                    '-job_start_time').first().job_start_time).strftime(
                '%Y-%m-%d %Z %H:%M:%S')
        except Exception:
            latest_scan_time = ""
        cvefix_all = SecurityAdvisoryFixHistoryModel.objects.all().values_list("cve_id")
        cvefix_all_count = len(set(cvefix_all))
        cvefix_today = cvefix_all.filter(fixed_at__startswith=localdate().strftime("%Y-%m-%d"))
        cvefix_today_count = len(set(cvefix_today))
        data = {
            "fixed_cve": {
                "affect_host_count": sa_affect_host_count,
                "cve_count": sa_cve_count,
                "high_cve_count": sa_high_cve_count,
                "cvefix_today_count": cvefix_today_count,
                "cvefix_all_count": cvefix_all_count,
                "latest_scan_time": latest_scan_time,
            },

            "unfixed_cve": {
                "affected_host_number": vul_affect_host_count,
                "cve_number": vul_cve_count,
                "high_cve_number": vul_high_cve_count,
            }
        }
        return success(result=data)

    def get_vul_info(self, queryset):
        cve_count = len(set([cve[0] for cve in queryset.values_list("cve_id")]))
        high_cve_count = len(set([cve[0] for cve in queryset.filter(score__gt=7.0).values_list("cve_id")]))
        affect_host = []
        for cve in queryset:
            affect_host.extend(list(cve.host.all()))
        affect_host_count = len(set(affect_host))
        return cve_count, high_cve_count, affect_host_count


class SaFixHistListView(APIView):
    authentication_classes = [Authentication]

    def get(self, request, format=None):
        sa_fix_hist = SecurityAdvisoryFixHistoryModel.objects.all()
        data = [{"id": fix_obj.id,
                 "cve_id": fix_obj.cve_id,
                 "fixed_time": fix_obj.fixed_at,
                 "fix_user": fix_obj.created_by.username,
                 "status": fix_obj.status,
                 "vul_level": fix_obj.vul_level} for fix_obj in sa_fix_hist]
        return success(result=data)


class SaFixHistDetailsView(APIView):
    authentication_classes = [Authentication]

    def get_cve2host_details(self, sa_fix_host_obj):
        hostname = sa_fix_host_obj.host.hostname
        host = HostModel.objects.filter(hostname=hostname).first()
        return {
            "hostname": hostname,
            "ip": host.ip,
            "created_by": host.created_by.username,
            "created_at": host.created_at,
            "host_status": host.get_status_display(),
            "status": sa_fix_host_obj.status,
            "details": str(sa_fix_host_obj.details),
        }

    def get(self, request, pk, format=None):
        sa_fix_hist_details = SaFixHistToHost.objects.filter(sa_fix_hist_id=pk)
        data = [self.get_cve2host_details(detail_obj) for detail_obj in sa_fix_hist_details]
        cve_id = sa_fix_hist_details.first().sa_fix_hist.cve_id

        for item in range(len(data)):
            data[item]["id"] = item + 1
        return success(result={
            "cve_id": cve_id,
            "hosts_datail": data
        })


class SaFixHistDetailHostView(APIView):
    authentication_classes = [Authentication]

    def get(self, request, pk, hostname, format=None):
        sa_fix_hist_details_host = SaFixHistToHost.objects.filter(sa_fix_hist_id=pk, host__hostname=hostname).first()
        data = {
            "hostname": hostname,
            "status": sa_fix_hist_details_host.status,
            "details": str(sa_fix_hist_details_host.details),
        }
        return success(result=data)


class UpdateSaView(APIView):
    authentication_classes = [Authentication]

    def post(self, request):
        """
        检测最近更新时间，如果小于时间间隔，则直接返回成功
        """
        try:
            last_update_sa_time = VulJobModel.objects.filter(job_name="update_sa").order_by(
                '-job_start_time').first().job_end_time
            if last_update_sa_time is None:
                return success(message="forbidden",
                               result="The data has been updated recently,no need to update it again")
            # 默认间隔时间为10分
            interval_time = 60 * 10
            current_time = localtime()
            if (current_time - last_update_sa_time).seconds < interval_time:
                return success(message="forbidden",
                               result="The data has been updated recently,no need to update it again")
            else:
                upsa()
                return success(result="Update security advisory data")
        except AttributeError:
            upsa()
            return success(result="Update security advisory data")


class VulAddrViewSet(viewsets.ModelViewSet):
    authentication_classes = [Authentication]
    queryset = VulAddrModel.objects.all()
    serializer_class = VulAddrListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name']

    def get_serializer_class(self):
        if self.request.method == "GET":
            return VulAddrListSerializer
        else:
            return VulAddrModifySerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset:
            return success([], total=0)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return success(result=response.data)

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return success(result={}, message="新增成功")

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return success(result={}, message="修改成功")

    # @action(detail=True, methods=['get'])
    # def test_connect(self, request, *args, **kwargs):
    #     vul = self.get_object()
    #     url, method, headers, params, payload, auth = vul.get_req_arg()
    #     req = requests.Request(method, url, headers=headers, data=payload, params=params, auth=auth)
    #     prepped = req.prepare()
    #     data = {"request": self.get_req_struct(prepped),
    #             "status": self.get_resp_result(prepped)}
    #     return success(result=data, message="")

    @action(detail=False, methods=['post'])
    def test_connect(self, request, *args, **kwargs):
        body = request.data
        url, method, headers, params, payload, auth = self.get_req_arg(body)
        req = requests.Request(method, url, headers=headers, data=payload, params=params, auth=auth)
        prepped = req.prepare()
        data = {"request": self.get_req_struct(prepped),
                "status": self.get_resp_result(prepped)}
        return success(result=data, message="")

    @staticmethod
    def get_req_arg(body):
        headers = body.get("headers")
        if "User-Agent" not in headers:
            headers[
                "User-Agent"] = "Mozilla/5.0 (X11; Linux x86_64) Chrome/99.0.4844.51"

        if body.get("authorization_type").lower() == "basic" and body.get("authorization_body"):
            auth = body.get("authorization_body")
        else:
            auth = {}

        for i in VulAddrModel.REQUEST_METHOD_CHOICES:
            if i[0] == body.get("method"):
                method = i[1]
                break

        return body.get("url"), method, headers, body.get("params"), body.get("body"), auth

    @staticmethod
    def get_req_struct(req):
        req_struct = '{}\n\n{}\n\n{}'.format(
            req.method + ' ' + req.url,
            '\n'.join('{}: {}'.format(k, v) for k, v in req.headers.items()),
            req.body,
        )
        return req_struct

    @staticmethod
    def get_resp_result(req):
        s = requests.Session()

        try:
            resp_status = s.send(req).status_code
            if status.is_success(resp_status) or status == status.HTTP_304_NOT_MODIFIED:
                msg = f"Status Code: {resp_status} OK"
            else:
                msg = f"Status Code: {resp_status} ERROR"
        except Exception as e:
            msg = f"Status Code: ERROR({e})"
        finally:
            return msg
