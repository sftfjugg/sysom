#!/bin/bash
#****************************************************************#
# ScriptName: deploy.sh
# Author: algalon
# Create Date: 2021-11-13 22:42
# Modify Date: 2021-11-16 00:02
# Function: deploy sysom
#***************************************************************#
APP_NAME="sysom"
SERVER_DIR="sysom_server"
WEB_DIR="sysom_web"
SCRIPT_DIR="script"
APP_HOME=/usr/local/sysom
SERVER_LOCAL_IP=""
SERVER_PUBLIC_IP=""
SERVER_PORT=""
SERVER_PORT=80

if [ $# -lt 3 ] ; then
    echo "USAGE: $0 INSTALL_DIR Internal_IP EXTERNAL_IP WEB_PORT"
    echo "Or we use default install dir: /usr/local/sysom/"
    echo "If WEB_PORT not set, use port 80 default"
    echo "E.g.: $0 /usr/local/sysom 192.168.0.100 120.26.xx.xx 80"
    exit 1
else
    APP_HOME=$1
    SERVER_LOCAL_IP=$2
    SERVER_PUBLIC_IP=$3
fi

if [ $# -eq 4 ] ; then
    SERVER_PORT=$4
fi

SERVER_HOME=${APP_HOME}/server

export APP_NAME=${APP_NAME}
export APP_HOME=${APP_HOME}
export SERVER_HOME=${APP_HOME}/server
export NODE_HOME=${APP_HOME}/node
export SERVER_LOCAL_IP=${SERVER_LOCAL_IP}
export SERVER_PUBLIC_IP=${SERVER_PUBLIC_IP}
export SERVER_PORT=${SERVER_PORT}

TARGET_PATH="${SERVER_HOME}/target"

if [ "$UID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

mkdir -p ${SERVER_HOME}

update_target() {
    if [ -d "${TARGET_PATH}" ]; then
        rm -rf ${TARGET_PATH}
    fi
    mkdir -p ${TARGET_PATH}
    echo "INFO: copy project file..."
    cp -r ${SERVER_DIR} ${WEB_DIR} ${TARGET_PATH}
    cp -r ${SCRIPT_DIR} ${APP_HOME}/init_scripts
    cp tools/deploy/sysom-server.service /usr/lib/systemd/system/
}

start_script_server() {
    bash -x ${APP_HOME}/init_scripts/server/init.sh
}

deploy() {
    update_target
    start_script_server
}

deploy
