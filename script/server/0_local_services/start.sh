#!/bin/bash
SERVICE_NAME=sysom-redis
start_local_redis() {
    supervisorctl start $SERVICE_NAME
}

start_redis() {
    ###we need redis version >= 5.0.0, check redis version###
    redis_version=`yum list all | grep "^redis.x86_64" | awk '{print $2}' | awk -F"." '{print $1}'`
    echo ${redis_version}
    if [ $redis_version -lt 5 ]
    then
        start_local_redis
    else
        systemctl start redis.service
    fi
}

start_app() {
    systemctl start mariadb.service
    systemctl start nginx.service
    systemctl start supervisord
    start_redis
}

start_app
