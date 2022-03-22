import { request} from 'umi';


const token = localStorage.getItem('token');

// 漏洞中心
  export async function listApi(options) {
    const msg= await  request('/api/v1/vul', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      ...(options || {}),
    
    });
    return msg
  }

  export async function summaryApi(options) {
    const msg= await  request('/api/v1/vul/summary', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      ...(options || {}),
    
    });
    return {
       affect:msg.data.fixed_cve.affect_host_count,
       cvecount:msg.data.fixed_cve.cve_count,
       highcount:msg.data.fixed_cve.high_cve_count
    }
  }



  export async function histApi(options) {
    const msg= await  request('/api/v1/vul/hist/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      ...(options || {}),
    
    });
    return msg;
  }

  export async function histidApi(id,options) {
    const msg = await request('/api/v1/vul/hist/' + id, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
       ...(options || {}),
    });
   
    return {
      setdatasource:msg.data.hosts_datail,
      title:msg.data.cve_id
    }
  };


  export async function getOneById(id,options) {
    const msg = await request('/api/v1/vul/' + id, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
       ...(options || {}),
    });
   
    return {
      title:msg.data.cve_id,
      setlovodata:msg.data.hosts,
      setdata:msg.data.software,

    };
  };

 

  export async function viewApi(id,name,options) {
    const msg = await request('/api/v1/vul/hist/' + id +'/'+ name, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
       ...(options || {}),
    });
   
    return msg;
  };


  export async function manyApi(body, options) {
    const msg = await request('/api/v1/vul/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      data: body,
      ...(options || {}),
    });
    return msg;
  }







