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
  // msg.data.reverse()
  return msg
}


export async function get_response_code(params, options) {
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