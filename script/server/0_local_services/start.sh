#!/bin/bash
start_redis() {
    ###we need redis version >= 5.0.0, check redis version###
    redis_version=`yum list all | grep "^redis.x86_64" | awk '{print $2}' | awk -F"." '{print $1}'`
    echo ${redis_version}
    if [ $redis_version -lt 5 ]
    then
        /usr/local/bin/redis-server /usr/local/bin/redis.conf &
    else
        systemctl start redis.service
    fi
}

start_app() {
    systemctl start mariadb.service
    systemctl start nginx.service
    systemctl start supervisord
    start_redis()
}

start_app
