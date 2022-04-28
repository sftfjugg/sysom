// @ts-ignore

/* eslint-disable */
import {
  request
} from 'umi';

export async function getAudit(params, options) {
  const token = localStorage.getItem('token');
  const msg = await request('/api/v1/journal/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    params: params,
    ...(options || {}),
  });
  return msg
}


export async function getResponseCode(params, options) {
  const token = localStorage.getItem('token');
  const result = await request('/api/v1/response_code/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    params: params,
    ...(options || {}),
  });
  return result
}

export async function getNotices(options) {
  const token = localStorage.getItem('token')
  return await request('/api/v1/get_user_alarm/', {
    method: 'GET',
    headers: {
      'Authorization': token
    },
    ...(options || {}),
  });
}

export async function getTaskList(params, options) {
  return request('/api/v1/tasks/', {
    method: 'GET',
    params: params,
    ...(options || {}),
  });
}

export async function getAlarmList(params, options) {
  const token = localStorage.getItem('token');
  const msg = await request('/api/v1/alarm/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    params: params,
    ...(options || {}),
  });
  return msg
}

export async function changeAlarmIsReadHandler(alarmId, body, options) {
  const token = localStorage.getItem('token')
  return await request(`/api/v1/alarm/${alarmId}/`, {
    method: 'PATCH',
    data: body,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    ...(options || {})
  })
}