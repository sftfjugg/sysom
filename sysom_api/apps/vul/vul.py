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
from django.utils import timezone
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
    cmd = 'dnf check-update cve *;cat /etc/os-release'
    spqm = SshProcessQueueManager(list(HostModel.objects.all()))
    results = spqm.run(spqm.ssh_command, cmd)
    #
    # cve2host_info={"cve1":[(host,software,version,os)]}
    # [{'host': 'GqYLM32pIZaNH0rOjd7JViwxPs', 'ret': {'status': 1, 'result': timeout('timed out')}}]
    cve2host_info = {}
    for result in results:
        host = result["host"]
        if result["ret"]['status'] == 0:
            cves, software, version, os = parse_sa_result(result["ret"]['result'])
            for cve in cves:
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
        cve_id, software_name, _, os = cve
        sacve_obj = SecurityAdvisoryModel.objects.filter(cve_id=cve_id, software_name=software_name, os=os).first()
        sacve_obj.host.clear()
    add_cves = new_cves - current_cves
    for cve in list(add_cves):
        cve_id, software_name, fixed_version, os = cve
        cve_obj_search = VulModel.objects.filter(cve_id=cve_id,
                                                 software_name=software_name)
        hosts = [host[0] for host in new_cveinfo[cve_id]]
        # 增加需要新增的cve列表
        if len(cve_obj_search) == 0:
            sacve = SecurityAdvisoryModel.objects.create(cve_id=cve_id,
                                                         software_name=software_name,
                                                         fixed_version=fixed_version,
                                                         os=os,
                                                         update_time=timezone.now())
        else:
            # 是用vul漏洞数据中的已知数据填充errata未获取到的数据
            cve_obj = cve_obj_search.first()
            sacve = SecurityAdvisoryModel.objects.create(cve_id=cve_id,
                                                         score=cve_obj.score,
                                                         description=cve_obj.description,
                                                         pub_time=cve_obj.pub_time,
                                                         vul_level=cve_obj.vul_level,
                                                         detail=cve_obj.detail,
                                                         software_name=software_name,
                                                         fixed_version=fixed_version,
                                                         os=os,
                                                         update_time=timezone.now())
        # 新增漏洞关联主机
        sacve.host.add(*HostModel.objects.filter(hostname__in=hosts))

    update_cves = new_cves & current_cves
    for cve in list(update_cves):
        cve_id, software_name, _, os = cve
        hosts = [host[0] for host in new_cveinfo[cve_id]]
        sacve_obj = SecurityAdvisoryModel.objects.filter(cve_id=cve_id, software_name=software_name, os=os).first()
        sacve_obj.host.clear()
        sacve_obj.host.add(*HostModel.objects.filter(hostname__in=hosts))


def parse_sa_result(result):
    """解析dnf获取的sa数据"""
    # TODO
    return result


def fix_cve(hosts, cve_id, user):
    cmd = 'dnf install --cve {}'.format(cve_id)
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
