# -*- encoding: utf-8 -*-
"""
@File    : vul.py
@Time    : 2022/2/16 下午3:37
@Author  : weidongkl
@Email   : weidong@uniontech.com
@Software: PyCharm
"""
import logging
import requests
import datetime
import json
import re
from loguru import logger
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from apps.vul.models import *
from apps.host.models import HostModel
from apps.vul.ssh_pool import SshProcessQueueManager, VulTaskManager

from lib.utils import human_datetime


def update_vul():
    job_start_time = timezone.now()
    job_id = "update_vul_{:%Y%m%d%H%M%S%f}".format(datetime.datetime.utcnow())
    update_vul_db()
    job_end_time = timezone.now()
    VulJobModel.objects.create(
        job_id=job_id,
        job_name="update_vul",
        job_desc="Start updating the vulnerability database",
        job_start_time=job_start_time,
        job_end_time=job_end_time,
    )


def update_vul_db():
    """
    更新漏洞数据库数据
    """
    logging.debug("Begin to get vul db address")
    vul_addrs = VulAddrModel.objects.all()
    for vul_addr in vul_addrs:
        logging.info("Try to get vul db info")
        vul_addr_obj = VulDataParse(vul_addr)
        try:
            body = vul_addr_obj.get_vul_data()
            if body:
                vul_addr_obj.parse_and_store_vul_data(body)
        except Exception as e:
            logging.warning(e)
            logging.warning(f"failed in {vul_addr.url}")


class VulDataParse(object):
    def __init__(self, vul_addr_obj: VulAddrModel):
        self.vul_addr_obj = vul_addr_obj
        self.cve_data_path = list(filter(None, self.vul_addr_obj.parser["cve_item_path"].split('/')))

    def get_vul_data(self):
        vul_data = []
        try:
            if self.vul_addr_obj.authorization_type.lower() == "basic" and self.vul_addr_obj.authorization_body:
                auth = (
                    self.vul_addr_obj.authorization_body["username"], self.vul_addr_obj.authorization_body["password"])
            else:
                auth = ()

            flag = True
            url = self.vul_addr_obj.url
            while flag:
                logging.info(url)
                resp = requests.request(self.vul_addr_obj.get_method_display(), url,
                                        headers=self.vul_addr_obj.headers,
                                        data=self.vul_addr_obj.body, params=self.vul_addr_obj.params,
                                        auth=auth)
                body = json.loads(resp.text)
                cve_path = self.cve_data_path
                cve_data = body
                next_url_data = body
                if len(cve_path) >= 1:
                    for i in cve_path:
                        cve_data = cve_data.get(i)
                    if len(cve_path) >= 2:
                        for i in cve_path[:-1]:
                            next_url_data = next_url_data.get(i)
                    if "next" in next_url_data:
                        url = next_url_data["next"]
                        if url is None:
                            flag = False
                        else:
                            flag = True
                    else:
                        flag = False
                else:
                    flag = False
                vul_data.extend(cve_data)
            if status.is_success(resp.status_code):
                self.set_vul_data_status_up()
            else:
                self.set_vul_data_status_down()
            return vul_data
        except Exception as e:
            self.set_vul_data_status_down()
            logging.warning(e)
            return vul_data

    def parse_and_store_vul_data(self, body):
        cve_data = body
        logging.info("Update sys_vul vul data")
        for cve in cve_data:
            cve_id = cve[self.vul_addr_obj.parser["cve_id_flag"]]
            cve_obj_search = VulModel.objects.filter(cve_id=cve_id)
            pub_time = cve.get(self.vul_addr_obj.parser["pub_time_flag"], None)
            if "level_flag" in self.vul_addr_obj.parser:
                vul_level = cve.get(self.vul_addr_obj.parser["level_flag"], None)
            else:
                vul_level = None
            if vul_level is None:
                vul_score = cve.get(self.vul_addr_obj.parser["score_flag"], None)
                if vul_score is None:
                    vul_level = ""
                else:
                    if int(vul_score) < 4:
                        vul_level = "low"
                    elif int(vul_score) < 7:
                        vul_level = "medium"
                    elif int(vul_score) < 9:
                        vul_level = "high"
                    else:
                        vul_level = "critical"

            logging.debug(f"Update sys_vul {cve_id} data")
            try:
                if len(cve_obj_search) == 0:
                    # print(f"0 {cve_id}")
                    VulModel.objects.create(cve_id=cve_id,
                                            pub_time=pub_time,
                                            vul_level=vul_level,
                                            update_time=timezone.now())
                else:
                    # print(vul_level, cve_obj_search.first().vul_level, cve_obj_search.first().vul_level != vul_level)
                    if vul_level and cve_obj_search.first().vul_level != vul_level:
                        cve_obj_search.update(
                            pub_time=pub_time,
                            vul_level=vul_level,
                            update_time=timezone.now())
            except Exception as e:
                logging.warning(e)
                logging.warning(f"Create or update {cve_id} failed")

    def set_vul_data_status(self, status):
        self.vul_addr_obj.status = status
        self.vul_addr_obj.save()

    def set_vul_data_status_down(self):
        self.set_vul_data_status(1)

    def set_vul_data_status_up(self):
        self.set_vul_data_status(0)


def get_unfix_cve():
    """

    Returns: QuerySet in django

    """
    unfix_cve_obj_search = VulModel.objects.filter(status="unfix")
    return unfix_cve_obj_search


def get_unfix_cve_format():
    """
    获取python 对象格式的未修复cve信息
    Returns: []

    """
    queryset = get_unfix_cve()
    data = []
    for i in queryset:
        data.append({"cve_id": i.cve_id,
                     "os": i.os,
                     "software_name": i.software_name})
    return data


def update_sa():
    job_start_time = timezone.now()
    job_id = "update_vul_{:%Y%m%d%H%M%S%f}".format(datetime.datetime.utcnow())
    update_sa_job_obj = VulJobModel.objects.create(
        job_id=job_id,
        job_name="update_sa",
        job_desc="Start updating the sa database",
        job_start_time=job_start_time,
    )
    cmd = r'''
#!/bin/bash
# 获取版本信息
dist=$(cat /etc/os-release | grep PLATFORM_ID | awk -F '"|:' '{print $3}')
if [ -z $dist ]; then
    dist="unknow"
fi
# 获取errata信息
declare -a cve_array
mapfile -t cve_array <<<$(dnf updateinfo list --with-cve 2>/dev/null | grep ^CVE | sort -k 1,1 -u | awk '{print $1 " " $3}')
for i in "${cve_array[@]}"; do
  cve_id=$(echo $i | awk '{print $1}')
  # 使用sed正则匹配rpm的包名，版本号，release
  rpm_pkg=$(echo $i | awk '{print $2}' | sed -e 's/^\(.*\)-\([^-]\{1,\}\)-\([^-]\{1,\}\)$/\1 \2 \3/' -e 's/\.\(el8\|el7\|an8\|oe\|uel20\|uelc20\).*$//g')
  rpm_version=$(echo $rpm_pkg | awk '{print $2"-"$3}')
  rpm_bin_name=$(echo $rpm_pkg | awk '{print $1}')
  # 根据包名字获取source包名称
  rpm_source_name=$(rpm -q $rpm_bin_name --queryformat "%{sourcerpm}\n" | head -n 1 | awk -F "-$(rpm -q $rpm_bin_name --queryformat "%{version}\n" | head -n 1)" '{print $1}')
  echo $cve_id $rpm_source_name $rpm_version $dist
done
'''
    # spqm = SshProcessQueueManager(list(HostModel.objects.all()))
    # results = spqm.run(spqm.ssh_command, cmd)

    hosts = [item['ip'] for item in HostModel.objects.all().values('ip')]
    vtm = VulTaskManager(hosts, cmd)
    results = vtm.run(VulTaskManager.run_command)
    #
    # cve2host_info={"cve1":[(host,software,version,os)]}
    # [{'host': 'GqYLM32pIZaNH0rOjd7JViwxPs', 'ret': {'status': 1, 'result': timeout('timed out')}}]
    cve2host_info = {}
    for result in results:
        host = result["host"]
        if result["ret"]['status'] == 0:
            for cve_info in parse_sa_result(result["ret"]['result']):
                cve, software, version, os = cve_info
                if cve in cve2host_info.keys():
                    cve2host_info[cve].append((host, software, version, os))
                else:
                    cve2host_info[cve] = [(host, software, version, os)]

    update_sa_db(cve2host_info)
    job_end_time = timezone.now()
    update_sa_job_obj.job_end_time = job_end_time
    update_sa_job_obj.save()


def update_sa_db(cveinfo):
    #
    # cve2host_info={"cve1":[(host,software,version,os)]}
    #
    current_cveinfo = SecurityAdvisoryModel.objects.all()
    current_cves = set([cve for cve in current_cveinfo.values_list("cve_id", "software_name", "fixed_version", "os")])
    new_cveinfo = cveinfo
    new_cves = set([(k, item[1], item[2], item[3]) for k, v in new_cveinfo.items() for item in v])
    delete_cves = current_cves - new_cves
    # 删除无效的关联关系，用于更新客户手动修复漏洞后，导致的数据库不匹配问题
    for cve in list(delete_cves):
        cve_id, software_name, fixed_version, os = cve
        sacve_obj = SecurityAdvisoryModel.objects.filter(cve_id=cve_id,
                                                         software_name=software_name,
                                                         fixed_version=fixed_version,
                                                         os=os).first()
        sacve_obj.host.clear()
    add_cves = new_cves - current_cves
    # [("cve_id", "software_name", "fixed_version", "os")]
    for cve in list(add_cves):
        cve_id, software_name, fixed_version, os = cve

        sacve = SecurityAdvisoryModel.objects.create(cve_id=cve_id,
                                                     software_name=software_name,
                                                     fixed_version=fixed_version,
                                                     os=os,
                                                     update_time=timezone.now())

        # (cve_id=cve_id,
        # software_name=software_name,
        # fixed_version=fixed_version,
        # os=os,
        # {"cve1":[(host,software,version,os)]}
        hosts = [cve_detail[0] for cve_detail in new_cveinfo[cve_id] if
                 cve_detail[1] == software_name and cve_detail[2] == fixed_version and cve_detail[3] == os]
        # 新增漏洞关联主机
        sacve.host.add(*HostModel.objects.filter(ip__in=hosts))

    # [("cve_id", "software_name", "fixed_version", "os")]
    update_cves = new_cves & current_cves
    for cve in list(update_cves):
        cve_id, software_name, fixed_version, os = cve
        hosts = [cve_detail[0] for cve_detail in new_cveinfo[cve_id] if
                 cve_detail[1] == software_name and cve_detail[2] == fixed_version and cve_detail[3] == os]
        sacve_obj = SecurityAdvisoryModel.objects.filter(cve_id=cve_id,
                                                         software_name=software_name,
                                                         fixed_version=fixed_version,
                                                         os=os).first()
        sacve_obj.host.clear()
        sacve_obj.host.add(*HostModel.objects.filter(hostname__in=hosts))

    # 更新漏洞数据库数据至sa
    for sacve_obj in set(
            SecurityAdvisoryModel.objects.filter(Q(pub_time='') | Q(vul_level='')).values_list("cve_id")):
        cve_obj_search = VulModel.objects.filter(cve_id=sacve_obj[0])
        if len(cve_obj_search) != 0:
            cve_obj = cve_obj_search.first()
            SecurityAdvisoryModel.objects.filter(cve_id=sacve_obj[0]).update(
                score=cve_obj.score,
                description=cve_obj.description,
                pub_time=cve_obj.pub_time,
                vul_level=cve_obj.vul_level,
                detail=cve_obj.detail,
                update_time=timezone.now(),
            )


def parse_sa_result(result):
    """解析dnf获取的sa数据"""
    cve_list = []
    for i in result.split("\n"):
        sa_re = "CVE-\d{4}-\d{4,7}(\s+\S+){3}"
        if re.match(sa_re, i, re.I):
            cve_list.append(i.split())
    return cve_list


def fix_cve(hosts, cve_id, user):
    cmd = 'dnf update --cve {} -y'.format(cve_id)
    # spqm = SshProcessQueueManager(list(HostModel.objects.filter(hostname__in=hosts)))
    # results = spqm.run(spqm.ssh_command, cmd)
    hosts = [host.ip for host in hosts]
    vtm = VulTaskManager(hosts, cmd)
    results = vtm.run(VulTaskManager.run_command)
    logger.info(results)
    fixed_time = human_datetime()
    user_obj = user.get('id', 1)
    vul_level = SecurityAdvisoryModel.objects.filter(cve_id=cve_id).first().vul_level
    cve_status = "success"
    init = True
    for ret in results:
        hostname = ret["host"]
        host_obj = HostModel.objects.filter(ip=hostname).first()
        if ret["ret"]["status"] == 0:
            status = "success"
            details = ret["ret"]["result"]
            sa_obj = SecurityAdvisoryModel.objects.filter(host__ip=hostname, cve_id=cve_id).first()
            sa_obj.host.remove(host_obj)
        else:
            status = "fail"
            cve_status = "fail"
            details = ret["ret"]["result"]

        if init:
            safh = SecurityAdvisoryFixHistoryModel.objects.create(fixed_at=fixed_time,
                                                                  cve_id=cve_id,
                                                                  vul_level=vul_level,
                                                                  created_by=user_obj,
                                                                  status=cve_status)
            init = False
        elif cve_status == "fail":
            safh.status = cve_status
            safh.save()
        safh.host.add(host_obj, through_defaults={'status': status, "details": details})

    return results


if __name__ == "__main__":
    pass
