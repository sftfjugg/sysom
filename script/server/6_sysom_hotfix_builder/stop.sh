#!/bin/bash

SERVICE_NAME=sysom-hotfix-builder

stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
