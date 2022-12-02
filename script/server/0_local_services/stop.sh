#!/bin/bash
stop_redis() {
    ###we need redis version >= 5.0.0, check redis version###
    redis_version=`yum list all | grep "^redis.x86_64" | awk '{print $2}' | awk -F"." '{print $1}'`
    echo ${redis_version}
    if [ $redis_version -lt 5 ]
    then
        pkill redis-server
    else
        systemctl stop redis.service
    fi
}

stop_app() {
    systemctl stop nginx.service
    systemctl stop mariadb.service
    systemctl stop supervisord
    stop_redis()
}

stop_app
