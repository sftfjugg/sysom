#!/bin/bash

host_ip=$1 #本行内容必须存在且不能改动，以便接收参数

# 以下内容可以自定义
arch=$(uname -m)
res(){
  local status=$1
  local msg=$2
  [[ $status -eq 0 ]] && echo -e "$host_ip $status delete $msg [OK]" >> result || echo -e "$host_ip $status delete $msg [FAILED]" >> result
}

check_version(){
  version=`cat /etc/alios-version | grep AliOS_version`
  echo -e "${version}"
}
check_version

rm -f result
