import {request} from 'umi';
import {stringify} from 'qs';

const token = localStorage.getItem('token');

/* *************** 操作系统迁移--迁移实施 *************** */

// 迁移机器组列表
export async function getBannerList(params) {
  return request('/api/v1/migration/group/', {
    method: 'GET',
  });
}

// 机器列表
export async function getNodesList(params) {
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

// 迁移信息
export async function qyeryMigrateInfo(params) {
  return request(`/api/v1/implementation/mig/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 日志和报告
export async function qyeryLog(params) {
  return request(`/api/v1/implementation/log/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 批量配置 & 开始迁移
export async function BulkMigration(params) {
  return request('/api/v1/implementation/migrate/', {
    method: 'POST',
    data: params,
  });
}

// 迁移操作 (环境准备step=1，系统备份step=2，迁移评估step=3，迁移实施setp=4，重启机器step=5，系统还原step=101，重置状态step=102）
export async function operateMachine(params) {
  return request('/api/v1/implementation/migrate/', {
    method: 'post',
    data: params,
  });
}

