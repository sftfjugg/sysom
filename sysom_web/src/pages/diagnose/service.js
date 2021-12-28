// @ts-ignore

/* eslint-disable */
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { request } from 'umi';

/** 获取宕机列表 GET /api/vmcore */
export async function getNetTable(params, options) {
  const msg = await request('/api/getable/', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
  return {
    data: msg.data,
    success: true,
    total: msg.total,
  };
}

export async function getMetric(params = {}, options) {
  const msg = await request('/api/metric/', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
  const metric = msg.data.seq.reduce((metric, item) => { 
    metric.push({
        x:item.meta.seq,
        y:item.delays.filter((item) => item.delay === "total")[0].ts
    }); return metric}, [])
  return {
    data: metric,
    success: true
  };
}
