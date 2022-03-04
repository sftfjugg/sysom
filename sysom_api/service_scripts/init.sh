#!/bin/bash

host_ip=$1 #本行内容必须存在且不能改动，以便接收参数

# 以下内容可以自定义
arch=$(uname -m)
res(){
  local status=$1
  local msg=$2
  [[ ${status} -eq 0 ]] && echo -e "${host_ip} ${msg} [OK]" >> result || echo -e "${host_ip} ${msg} [FAILED]" >> result
}

check_aliosrepo(){
  let ret=0
  [[ $(md5sum /etc/yum.repos.d/alios.repo | awk '{ print $1 }') == "8abd867ce49c0f128d457ef741bb73f3" ]] || ((ret++))
  [[ $(stat -c %a /etc/yum.repos.d/alios.repo) == "644" ]] || ((ret++))
  res $ret $FUNCNAME
}
check_aliosrepo