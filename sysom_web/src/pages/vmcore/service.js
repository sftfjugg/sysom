// @ts-ignore

/* eslint-disable */
import { request } from "umi";

/** 获取宕机列表 GET /api/vmcore */
export async function getVmcore(params, options) {
  if (params?.similar_dmesg) {
    let { current, pageSize, ...data } = params;
    delete params.similar_dmesg;
    return request("/api/v1/vmcore/", {
      method: "POST",
      data,
      params: { ...params },
      ...(options || {}),
    });
  } else {
    return request("/api/v1/vmcore/", {
      method: "GET",
      params: { ...params },
      ...(options || {}),
    });
  }
}

export async function getStatistics(options) {
  return request("/api/v1/vmcore/", {
    method: "GET",
    ...(options || {}),
  });
}

export async function getSimilarPanic(params, options) {
  return request("/api/v1/vmcore/", {
    method: "GET",
    params: { ...params },
    ...(options || {}),
  });
}

export async function getVmcoreDetail(params, options) {
  return request("/api/v1/vmcore_detail/", {
    method: "GET",
    params: { ...params },
    ...(options || {}),
  });
}
export async function getSolution(params, options) {
  const msg = await request("/api/v1/issue/", {
    method: "GET",
    params: { ...params },
    ...(options || {}),
  });
  let data = msg.data;
  if (msg.data?.length > 0) {
    data = msg.data[0];
  }
  const results = {
    success: true,
    data: data,
  };
  return results;
}

export async function addIssue(data, options) {
  return request("/api/v1/issue/", {
    data,
    method: "POST",
    ...(options || {}),
  });
}

// export async function postConfig(params, options) {
//   return request('/api/config', {
//     method: 'POST',
//     data: params,
//     ...(options || {}),
//   });
// }

export async function getConfig(params, options) {
  return request('/api/v1/vmcore/', {
    method: "GET",
    params: { ...params },
    ...(options || {}),
  });
  let data = msg.data;
  const results = {
    success: true,
    data: data,
  };
  return results;
}
export async function postConfig(params, options) {
  return request('/api/v1/vmcore/', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}
