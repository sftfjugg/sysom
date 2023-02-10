// @ts-ignore

/* eslint-disable */
import { request } from 'umi';
import _ from "lodash";

//GET /api/v1/tasks/xxxxx/
export async function getHomeData(params = {}, options) {
  const token = localStorage.getItem('token');
  const msg = await request('/api/v1/home/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    params: { ...params },
    ...(options || {}),
  });
  return msg;
};
