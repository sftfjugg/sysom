import { request } from 'umi'

const ACCOUNT_URL = '/api/v1/user/';
const ROLE_URL = '/api/v1/role/';


export async function getAccountList(params, options) {
    const token = localStorage.getItem('token');
    return request(ACCOUNT_URL, {
        method: 'GET',
        headers: {
            'Authorization': token
        },
        params: params,
        ...(options || {}),
    });
}

export async function delAccount(id, options) {
    const token = localStorage.getItem('token');
    return request(`${ACCOUNT_URL}${id}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
        },
        ...(options || {})
    })
}

export async function addAccount(body, options) {
    const token = localStorage.getItem('token');
    return request(ACCOUNT_URL, {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
        },
        data: body,
        ...(options || {})
    })
}

export const updateAccount = async (userId, body, options) => {
    const token = localStorage.getItem('token');
    return request(`${ACCOUNT_URL}${userId}/`, {
        method: 'PUT',
        headers: {
            'ContentType': 'application/json',
            'Authorization': token
        },
        data: body,
        ...(options || {})
    })
}

export const getRoles = async (params, options) => {
    const token = localStorage.getItem('token');
    return request(ROLE_URL, {
        method: 'GET',
        headers: {
            'Authorization': token,
        },
        params: params,
        ...(options || {})
    })
}
