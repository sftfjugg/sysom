#!/bin/bash
SERVICE_NAME=sysom-demo
start_app() {
    supervisorctl start $SERVICE_NAME
}

start_app
