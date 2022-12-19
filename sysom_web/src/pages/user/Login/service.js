// @ts-ignore

/* eslint-disable */
import {
  request
} from 'umi';
/** 获取当前的用户 GET /api/currentUser */
export async function currentUser(userId, token, options) {
  return request('/api/v1/user/' + userId + '/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    ...(options || {}),
  });
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options) {
  return request('/api/login/outLogin/', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/login/account */
export async function login(body, options) {
  return request('/api/v1/auth/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 密码修改接口 POST /api/v1/change_password/ */
export async function ChangePassword(body, options) {
  return request('/api/v1/change_password/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
