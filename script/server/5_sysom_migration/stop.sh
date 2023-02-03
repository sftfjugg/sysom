#!/bin/bash

SERVICE_NAME=sysom-migration

stop_app() {
    supervisorctl stop $SERVICE_NAME
}

stop_app
