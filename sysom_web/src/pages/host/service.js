// @ts-ignore

/* eslint-disable */
import {
  request
} from 'umi';
/** 获取当前的用户 GET /api/currentUser */

export async function getCluster(options) {
  const msg = await request('/api/v1/cluster/', {
    method: 'GET',
    ...(options || {}),
  });
  const array = msg.data
  const results = array?.map(item => {
    return {
      label: item.cluster_name,
      value: item.id,
    }
  });
  return results
}

export async function addCluster(body, token, options) {
  return request('/api/v1/cluster/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: body,
    ...(options || {}),
  });
}

export async function getHost(params, options) {
  return request('/api/v1/host/', {
    method: 'GET',
    params: params,
    ...(options || {}),
  });
}

export async function addHost(body, token, options) {
  return request('/api/v1/host/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteHost(id, token, options) {
  return request('/api/v1/host/' + id + '/', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    ...(options || {}),
  });
}

export async function addBulkImport(params, token, options) {
  return request('/api/v1/host/batch_add/', {
    method: 'post',
    data: params,
    headers: {
      'Authorization': token
    },
    ...(options || {})
  })
}

export async function delBulkHandler(body, token, options) {
  return request('/api/v1/host/batch_del/', {
    method: 'post',
    data: body,
    headers: {
      'Authorization': token
    },
    ...(options || {})
  })
}