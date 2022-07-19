// @ts-ignore

/* eslint-disable */
import {
  request
} from 'umi';
/** 获取当前的用户 GET /api/currentUser */

const CLUSTER_URL = '/api/v1/cluster/';
const HOST_URL = '/api/v1/host/';

export async function getCluster(options) {
  const msg = await request(CLUSTER_URL, {
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
  return request(CLUSTER_URL, {
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
  return request(HOST_URL, {
    method: 'GET',
    params: params,
    ...(options || {}),
  });
}

export async function getHostName(options) {
  const msg = await request(HOST_URL, {
    method: 'GET',
    ...(options || {}),
  });
  const array = msg.data
  console.log(msg,array);
  const results = array?.map(item => {
    return {
      label: item.hostname,
      value: item.id,
    }
  });
  return results
}

export async function addHost(body, token, options) {
  return request(HOST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateHost(body, token, options) {
  return request(`${HOST_URL}${body.id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: body,
    ...(options || {}),
  })
}

export async function deleteHost(id, token, options) {
  return request(`${HOST_URL}${id}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    ...(options || {}),
  });
}

export async function addBulkImport(params, token, options) {
  return request(`${HOST_URL}batch_add/`, {
    method: 'post',
    data: params,
    headers: {
      'Authorization': token
    },
    ...(options || {})
  })
}

export async function delBulkHandler(body, token, options) {
  return request(`${HOST_URL}batch_del/`, {
    method: 'post',
    data: body,
    headers: {
      'Authorization': token
    },
    ...(options || {})
  })
}