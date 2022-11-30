#!/bin/bash


SERVICE_NAME=sysom-migration

start_app() {
    supervisorctl start $SERVICE_NAME
}

start_app
