#!/bin/bash
start_app() {
    systemctl stop nginx.service
    systemctl stop supervisord.service
    systemctl stop redis.service
    systemctl stop mariadb.service
}

start_app
