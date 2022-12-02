#!/bin/bash
stop_redis() {
    ###we need redis version >= 5.0.0, check redis version###
    redis_version=`yum list all | grep "^redis.x86_64" | awk '{print $2}' | awk -F"." '{print $1}'`
    echo ${redis_version}
    if [ $redis_version -lt 5 ]
    then
        kill -9 `ps -e | grep redis-server | awk '{print $1}'`
    else
        systemctl stop redis.service
    fi
}

stop_app() {
    systemctl stop nginx.service
    systemctl stop supervisord
    stop_redis()
}

clear_db() {
    systemctl start mariadb.service
    mysql -uroot -e "drop database if exists sysom;"
    mysql -uroot -e "drop database if exists grafana;"
    systemctl stop mariadb.service
}

clear_app() {
    stop_app
    clear_db
}

clear_app
