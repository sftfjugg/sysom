#!/bin/bash
#****************************************************************#
# ScriptName: start local service
# Author: huangtuquan
#***************************************************************#
SERVICE_NAME=sysom-redis
usr_local_redis=0

setup_database() {
    echo "INFO: begin create db..."

    systemctl restart mariadb.service
    systemctl enable mariadb.service
    mysql -uroot -e "create user if not exists 'sysom'@'%' identified by 'sysom_admin';"
    mysql -uroot -e "grant usage on *.* to 'sysom'@'localhost' identified by 'sysom_admin'"
    mysql -uroot -e "drop database if exists sysom;"
    mysql -uroot -e "create database sysom character set utf8;"
    mysql -uroot -e "create database grafana character set utf8;"
    mysql -uroot -e "grant all privileges on sysom.* to 'sysom'@'%';"
    mysql -uroot -e "grant all privileges on grafana.* to 'sysom'@'%';"
    mysql -uroot -e "flush privileges;"
}
setup_nginx() {
    mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
    cp nginx.conf /etc/nginx/
    cp sysom.conf /etc/nginx/conf.d/
    ###change the install dir base on param $1###
    sed -i "s;SERVER_PORT;${SERVER_PORT};g" /etc/nginx/conf.d/sysom.conf
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/nginx/conf.d/sysom.conf
}

init_conf() {
    cp ${SERVICE_NAME}.ini /etc/supervisord.d/
    ###change the install dir base on param $1###
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/supervisord.d/${SERVICE_NAME}.ini
}

setup_redis() {
    ###we need redis version >= 5.0.0, check redis version###
    redis_version=`yum list all | grep "^redis.x86_64" | awk '{print $2}' | awk -F"." '{print $1}'`
    echo ${redis_version}
    if [ $redis_version -lt 5 ]
    then
        init_conf
        usr_local_redis=1
    fi
}

start_local_redis() {
    ###if supervisor service started, we need use "supervisorctl update" to start new conf####
    supervisorctl update
    supervisorctl status ${SERVICE_NAME}
    if [ $? -eq 0 ]
    then
        echo "supervisorctl start ${SERVICE_NAME} success..."
        return 0
    fi
    echo "${SERVICE_NAME} service start fail, please check log"
    exit 1
}

start_app() {
    systemctl enable nginx.service
    systemctl restart nginx.service
    if [ $usr_local_redis == 1 ]
    then
        ###if redis systemd service has been start, we need stop it first###
        systemctl status redis
        if [ $? -eq 0 ]
        then
            systemctl stop redis
        fi
        start_local_redis
    else
        systemctl enable redis.service
        systemctl restart redis.service
    fi
    systemctl start supervisord
}

deploy() {
    setup_database | tee -a ${SERVER_HOME}/logs/${APP_NAME}_setup_database.log 2>&1
    setup_nginx
    setup_redis
    start_app
}

deploy
