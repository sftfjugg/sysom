#!/bin/bash
SERVICE_NAME=sysom-monitor-server
start_app() {
    supervisorctl start $SERVICE_NAME
}

start_app
