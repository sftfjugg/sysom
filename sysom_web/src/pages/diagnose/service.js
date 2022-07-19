// @ts-ignore

/* eslint-disable */
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { request } from 'umi';
import _ from "lodash";

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
    console.error('Fetch task list error. err:', e);
    return {
      success: false,
    };
  }
}

//GET /api/vi/tasks/xxxxx/
export async function getTask(id, params = {}, options) {

  const msg = await request('/api/v1/tasks/' + id + '/', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
  return msg.data;

};



