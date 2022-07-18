// @ts-ignore

/* eslint-disable */
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { request } from 'umi';
import _ from "lodash";

/** 获取宕机列表 GET /api/vmcore */




//POST /api/v1/tasks
//{service:"pingtrace",
//源IP:"xxx"}
export async function postTask(params, options) {
  return request('/api/v1/tasks/', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}


//GET /api/v1/tasks
//
export async function getTaskList(params, options) {
  try {
    const msg = await request('/api/v1/tasks/', {
      method: 'GET',
      params: { ...params },
      ...(options || {}),
    });
    msg.data = msg.data.map((item) => ({ ...item, ...item.params }))
    return {
      data: _.orderBy(msg.data, 'created_at', 'desc'),
      success: true,
      total: msg.total,
    };
  } catch (e) {
    console.error('Fetch task list error. err:', error);
    return {
      success: false,
    };    
  }
}

//GET /api/vi/tasks/xxxxx/
export async function _getTask(id, params = {}, options) {
  const msg = await request('/api/v1/tasks/' + id + '/', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
  return msg.data;
};


//GET /api/vi/tasks/xxxxx/
export async function getTask(id, params = {}, options) {
  const msg = await request('/api/v1/tasks/' + id, {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });

  if (msg.data.status == "Success") {
    msg.data.metric = msg.data.result.seq.reduce((metric, item) => {
      metric.push({
        x: String(item.meta.seq),
        delay: item.delays.filter((item) => item.delay === "total")[0].ts
      }); return metric
    }, [])
  }

  return msg.data;
}

/** 获取IO延时诊断列表 GET /api/IO */
export async function getIoTable(params, options) {
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
/**io延时诊断 诊断 */
export async function postIOTask(params, options) {
  return request('/api/iotask/', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 获取内存诊断大盘列表 GET /api/market */
export async function getMarketTable(params, options) {
  const msg = await request('/api/marketable/', {
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
/** 内存诊断大盘 诊断 POST /api/marketask */
export async function postMarketTask(params, options) {
  return request('/api/marketask/', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}


