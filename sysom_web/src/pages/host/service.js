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

/**
 * 获取集群列表
 * @param {*} options 
 * @returns 
 */
 export async function getClusterList(options) {
  return request(CLUSTER_URL, {
    method: 'GET',
    ...(options || {}),
  });
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

/**
 * 删除单个集群
 * @param {number} id 
 * @param {string} token 
 * @param {object} options 
 * @returns 
 */
export async function delCluster(id, token, options) {
  return request(`${CLUSTER_URL}${id}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    ...(options || {}),
  })
}

/**
 * 批量导入集群
 * @param {object} params 
 * @param {str} token 
 * @param {object} options 
 * @returns 
 */
export async function batchAddCluster(params, token, options) {
  return request(`${CLUSTER_URL}batch_add/`, {
    method: 'post',
    data: params,
    headers: {
      'Authorization': token
    },
    ...(options || {})
  })
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
      value: item.hostname,
    }
  });
  return results
}
export async function getHostIP(options) {
  const msg = await request(HOST_URL, {
    method: 'GET',
    ...(options || {}),
  });
  const array = msg.data
  console.log(msg,array);
  const results = array?.map(item => {
    return {
      label: item.ip,
      value: item.ip,
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

export async function batchAddHost(params, token, options) {
  return request(`${HOST_URL}batch_add/`, {
    method: 'post',
    data: params,
    headers: {
      'Authorization': token
    },
    ...(options || {})
  })
}

export async function batchDelHost(body, token, options) {
  return request(`${HOST_URL}batch_del/`, {
    method: 'post',
    data: body,
    headers: {
      'Authorization': token
    },
    ...(options || {})
  })
}