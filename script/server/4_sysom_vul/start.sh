#!/bin/bash


SERVICE_NAME=sysom-vul

start_app() {
    supervisorctl start $SERVICE_NAME
}

start_app
