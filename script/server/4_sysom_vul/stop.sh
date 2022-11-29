#!/bin/bash

SERVICE_NAME=sysom-vul

stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
