#!/bin/bash
SERVICE_NAME=sysom-diagnosis
stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
