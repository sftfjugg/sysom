import {post,get} from '../security/axios'
// export function listApi(data){
//     return post("api/v1/list",data)
// }
export function xiufuApi(data){
    return post("api/v1/Progress",data)
}
export  function listApi(){
    return get("api/v1/vul")
}

export function histApi(){
    return get("api/v1/vul/hist/")
}

export function getOneById(id) {
    return get(`api/v1/vul/${id}`);
  }


export function manyApi(data){
    return post("api/v1/vul/",data)
}

export function histidApi(id){
    return get (`api/v1/vul/hist/${id}`)
}

export function viewApi(id,name){
    return get (`api/v1/vul/hist/${id}/${name}`)
}
  