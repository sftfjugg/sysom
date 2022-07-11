#!/bin/bash
stop_app() {
    systemctl stop nginx.service
    systemctl stop supervisord.service
    systemctl stop redis.service
    systemctl stop mariadb.service
}

stop_app
