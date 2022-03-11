import axios from "axios";
import { getToken } from "./auth";

const instance = axios.create({
    baseURL: "http://10.7.13.34:9999/",
    // timeout: 5000
  });



// Add a request interceptor
//  全局请求拦截，发送请求之前执行
instance.interceptors.request.use(
  function(config) {
  
    config.headers["Authorization"] = getToken();
    return config;
  },
  function(error) {
   
    return Promise.reject(error);
  }
);

// Add a response interceptor
//  请求返回之后执行
instance.interceptors.response.use(
  function(response) {

    return response.data;
  },
  function(error) {
    
    return Promise.reject(error);
  }
);




export function get(url){
  return instance.get(url)
}


export function post(url, data) {
  return instance.post(url, data);
}



