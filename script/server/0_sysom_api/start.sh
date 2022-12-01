#!/bin/bash
SERVICE_NAME=sysom-api
stop_app() {
    for service in `supervisorctl status | grep ${SERVICE_NAME} | awk '{print $1}'`
    do
        supervisorctl start $service
    done
}

stop_app
