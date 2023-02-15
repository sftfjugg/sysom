#!/bin/bash
SERVICE_NAME=sysom-monitor-server
stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
