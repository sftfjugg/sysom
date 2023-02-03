#!/bin/bash

SERVICE_NAME=sysom-hotfix

stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
