#!/bin/bash
start_app() {
    systemctl start mariadb.service
    systemctl start nginx.service
    systemctl start redis.service
    systemctl start supervisord.service
}

start_app
