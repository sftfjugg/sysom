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

// 批量实施
export async function BulkMigration(params) {
  return request('/api/v1/implementation/migrate/all/', {
    method: 'POST',
    data: params,
  });
}

// 开始迁移
export async function startMigration(params) {
  return request('/api/v1/implementation/migrate/', {
    method: 'POST',
    data: params,
  });
}

// 迁移操作 (系统备份step=1，环境准备step=2，风险评估step=3，迁移实施setp=4，重启机器step=5，系统还原step=101，重置状态step=102）
export async function operateMachine(params) {
  return request('/api/v1/implementation/migrate/', {
    method: 'post',
    data: params,
  });
}

/* *************** 迁移评估 *************** */
// 选择机器
export async function queryAssessHost(params) {
  return request('/api/v1/assessment/host/', {
    method: 'GET',
  });
}
// 选择数据文件
// export async function querySqlFile(params) {
//   return request('/api/v1/assessment/sqlfile/', {
//     method: 'GET',
//   });
// }

// 开始评估
export async function queryStartAssess(params) {
  return request('/api/v1/assessment/start/', {
    method: 'post',
    data: params,
  });
}

// 评估-机器列表 & 评估报告-节点列表
export async function queryAssessList(params) {
  return request('/api/v1/assessment/list/', {
    method: 'GET',
  });
}

// 停止评估
export async function queryStopAssess(params) {
  return request('/api/v1/assessment/stop/', {
    method: 'post',
    data: params,
  });
}

// 评估重试
export async function queryRetryAssess(params) {
  return request('/api/v1/assessment/retry/', {
    method: 'post',
    data: params,
  });
}

// 评估删除
export async function queryDeleteAssess(params) {
  return request('/api/v1/assessment/delete/', {
    method: 'post',
    data: params,
  });
}

// 硬件--板卡评估结果列表
export async function queryHardwareList(params) {
  return request(`/api/v1/assessment/hard/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 风险--迁移风险评估
export async function queryRiskList(params) {
  return request(`/api/v1/assessment/imp/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 应用--应用列表
export async function queryAppList(params) {
  return request(`/api/v1/assessment/app/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 应用--acl依赖评估
export async function queryAclList(params) {
  return request(`/api/v1/assessment/app/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 应用--abi接口列表
export async function queryAbiList(params) {
  return request(`/api/v1/assessment/app/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 系统配置-类型
export async function querySysType(params) {
  return request(`/api/v1/assessment/sys/?${stringify(params)}`, {
    method: 'GET',
  });
}

// 系统配置-列表
export async function querySysList(params) {
  return request(`/api/v1/assessment/sys/?${stringify(params)}`, {
    method: 'GET',
  });
}
