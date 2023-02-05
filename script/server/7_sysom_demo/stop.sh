#!/bin/bash
SERVICE_NAME=sysom-demo
stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
