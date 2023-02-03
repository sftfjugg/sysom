import { async } from "@antv/x6/lib/registry/marker/async";
import { request } from "umi";

export async function getHotfixList(params, options) {
    const token = localStorage.getItem('token');
    return request('/api/v1/hotfix/get_hotfix_list/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    params: params,
    ...(options || {}),
  });
}

export async function queryFormalHotfixList(params, options) {
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/get_formal_hotfix_list/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    params: params,
    ...(options || {}),
  });
}

export async function delHotfix(id, token, options) {
  return request('/api/v1/hotfix/delete_hotfix/', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      id
    },
    ...(options || {}),
  })
}

export async function setFormal(id, token, options) {
  return request('/api/v1/hotfix/set_formal/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      id 
    },
    ...(options || {}),
  })
}

export const normFile = (e) => {
  console.log('Upload event:', e);
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

export const uploadProps = {
  name:'patch_file',
  action: '/api/v1/hotfix/upload_patch/',
  headers: {
    'Authorization': localStorage.getItem('token'),
  },
  accept:".patch,.diff",
  method:"post",
  onChange({ file, fileList }) {
    if (file.status !== 'uploading') {
      console.log(fileList[0]);
    }
    if (file.status == 'done'){
      console.log(`${file.name} file uploaded successfully`);
    } else if (file.status === 'error') {
      console.log(`${file.name} file upload failed.`);
    }
  },
  maxCount:1,
}

export async function createHotfix(token, params, options) {
  return request('/api/v1/hotfix/create_hotfix/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      'kernel_version': params.kernel_version,
      'hotfix_name': params.hotfix_name,
      'os_type': params.os_type,
      'upload': params.upload
    },
    ...(options || {}),
  })
}

export function getHotfixLog(id, options) {
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/get_build_log/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    params: {
      id
    },
    ...(options || {}),
  });
}

export function downloadHotfixFile(id, options){
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/download_hotfix/', {
    method: 'GET',
    responseType: 'blob', // 必须加这属性，说明是文件流
    getResponse: true,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    params: {
      id
    },
    ...(options || {}),
  });
}


export async function postChangeOsType(params, options){
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/update_ostype/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      "id": params.id,
      "os_type": params.os_type_name,
      "git_repo": params.git_repo_link,
      "image": params.image,
    },
    ...(options || {}),
  })
}

export async function postChangeKernelVersion(params, options){
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/update_kernel_relation/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      "id": params.id,
      "kernel_version": params.kernel_version,
      "os_type": params.os_type,
      "git_branch": params.git_branch,
      "devel_link": params.devel_link,
      "debuginfo_link": params.debuginfo_link
    },
    params: params,
    ...(options || {}),
  })
}

export async function getOSTypeList(params, options) {
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/get_os_type_relation/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token,
  },
  params: params,
  ...(options || {}),
});
}

export async function getKernelVersionList(params, options) {
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/get_kernel_relation/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token,
  },
  params: params,
  ...(options || {}),
});
}

export async function submitOSType(params, options) {
  const token = localStorage.getItem('token');
  console.log(params)
  return request('/api/v1/hotfix/create_os_type_relation/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      "os_type":params.os_type,
      "git_repo":params.git_repo,
      "image": params.image
    },
    params: params,
    ...(options || {}),
  });
}

export async function submitKernelVersion(params, options) {
  console.log(params)
  const token = localStorage.getItem('token');
  return request('/api/v1/hotfix/create_kernel_relation/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token,
  },
  data:{
    "os_type": params.os_type,
    "kernel_version": params.kernel_version,
    "git_branch": params.git_branch,
    "devel_link": params.devel_link,
    "debuginfo_link": params.debuginfo_link
  },
  params: params,
  ...(options || {}),
});
}

export async function delOSType(id, token, options) {
  return request('/api/v1/hotfix/delete_os_type/', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      id
    },
    ...(options || {}),
  })
}

export async function delKernelVersion(id, token, options) {
  return request('/api/v1/hotfix/delete_kernel_relation/', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    data: {
      id
    },
    ...(options || {}),
  })
}