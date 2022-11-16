#!/bin/bash
#****************************************************************#
# ScriptName: start local service
# Author: huangtuquan
#***************************************************************#
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

start_app() {
    systemctl enable nginx.service
    systemctl enable redis.service
    systemctl restart nginx.service
    systemctl restart redis.service
}

deploy() {
    setup_database | tee -a ${SERVER_HOME}/logs/${APP_NAME}_setup_database.log 2>&1
    start_app
}

deploy
