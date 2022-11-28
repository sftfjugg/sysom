#!/bin/bash
SERVICE_NAME=sysom-channel
stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
