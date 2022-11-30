import { request } from 'umi';
import { stringify } from 'qs';

const token = localStorage.getItem('token');

/* *************** 操作系统迁移--迁移实施 *************** */

// 迁移机器组列表
export async function getBannerList(params) {
  return request(`/api/v1/migration/group/`, {
    method: 'GET',
  });
}

// 机器列表
export async function getNodesList(params) { //id=1
  return request(`/api/v1/implementation/list/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 机器信息
export async function qyeryMachineInfo(params) {
  return request(`/api/v1/implementation/info/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 迁移日志
export async function qyeryLog(params) {
  return request(`/api/v1/implementation/log/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 迁移报告
export async function qyeryReport(params) {
  return request(`/api/v1/implementation/report/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 停止迁移
export async function stopMigration(params) {
  return request(`/api/v1/implementation/stop/`, {
    method: 'POST',
    data: params,
  });
}

// 批量迁移 & 开始迁移
export async function BulkMigration(params) {
  return request(`/api/v1/implementation/migrate/`, {
    method: 'POST',
    data: params,
  });
}

// 重启机器
export async function rebootMachine(params) {
  return request(`/api/v1/implementation/reboot/`, {
    method: 'post',
    data: params,
  });
}

