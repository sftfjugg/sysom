#!/bin/bash

SERVICE_NAME=sysom-vul


clear_app() {
    supervisorctl stop $SERVICE_NAME
    rm -rf /etc/supervisord.d/${SERVICE_NAME}.ini
}

clear_app
