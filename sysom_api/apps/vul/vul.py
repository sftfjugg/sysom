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
import json
import re
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from apps.vul.models import *
from apps.host.models import HostModel
from apps.vul.ssh_pool import SshProcessQueueManager

from lib.utils import human_datetime


def update_vul():
    update_vul_db()


def update_vul_db():
    """
    更新漏洞数据库数据
    """
    logging.debug("Begin to get vul db address")
    vul_addrs = VulAddrModel.objects.all()
    for vul_addr in vul_addrs:
        logging.info("Try to get vul db info")
        resp = requests.get(vul_addr.vul_address)
        if resp.status_code != status.HTTP_200_OK:
            logging.warning("update vul information failed")
            break
        body = json.loads(resp.text)
        for cve in body["data"]["items"]:
            logging.info("Update sys_vul vul data")
            cve_obj_search = VulModel.objects.filter(cve_id=cve['cveid'], os=str(cve['os']),
                                                     software_name=cve['source'])
            if len(cve_obj_search) == 0:
                VulModel.objects.create(cve_id=cve['cveid'],
                                        score=cve['score'],
                                        description=str(cve['description']),
                                        pub_time=cve['pub_time'],
                                        vul_level=cve['vul_level'],
                                        detail=str(cve['detail']),
                                        software_name=cve['source'],
                                        fixed_time=str(cve['fixed_time']),
                                        fixed_version=str(cve['fixed_version']),
                                        os=str(cve['os']),
                                        status=cve['status'],
                                        update_time=timezone.now())
            else:
                cve_obj_search.update(
                    score=cve['score'],
                    description=str(cve['description']),
                    pub_time=cve['pub_time'],
                    vul_level=cve['vul_level'],
                    detail=str(cve['detail']),
                    software_name=cve['source'],
                    fixed_time=str(cve['fixed_time']),
                    fixed_version=str(cve['fixed_version']),
                    os=str(cve['os']),
                    status=cve['status'],
                    update_time=timezone.now())


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
    spqm = SshProcessQueueManager(list(HostModel.objects.all()))
    results = spqm.run(spqm.ssh_command, cmd)
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
        sacve.host.add(*HostModel.objects.filter(hostname__in=hosts))

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
            SecurityAdvisoryModel.objects.filter(Q(pub_time='') | Q(score='') | Q(vul_level='')).values_list("cve_id")):
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
    spqm = SshProcessQueueManager(list(HostModel.objects.filter(hostname__in=hosts)))
    results = spqm.run(spqm.ssh_command, cmd)
    fixed_time = human_datetime()
    user_obj = user
    vul_level = SecurityAdvisoryModel.objects.filter(cve_id=cve_id).first().vul_level
    cve_status = "success"
    init = True
    for ret in results:
        hostname = ret["host"]
        host_obj = HostModel.objects.filter(hostname=hostname).first()
        if ret["ret"]["status"] == 0:
            status = "success"
            details = ret["ret"]["result"]
            sa_obj = SecurityAdvisoryModel.objects.filter(host__hostname=hostname, cve_id=cve_id).first()
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
