#!/bin/bash


SERVICE_NAME=sysom-hotfix

start_app() {
    supervisorctl start $SERVICE_NAME
}

start_app
