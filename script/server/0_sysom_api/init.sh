#!/bin/bash
#****************************************************************#
# ScriptName: deploy.sh
# Author: algalon
# Create Date: 2021-11-13 22:42
# Modify Date: 2021-11-16 00:02
# Function: deploy sysom
#***************************************************************#
SERVER_DIR="sysom_server"
API_DIR=${SERVER_DIR}/sysom_api
VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
TARGET_PATH=${SERVER_HOME}/target
SERVICE_NAME=sysom-api

if [ "$UID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

mkdir -p ${SERVER_HOME}

source_virtualenv() {
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

init_conf() {
    mkdir -p /run/daphne
    pushd ${TARGET_PATH}/${API_DIR}
    python manage.py migrate
    popd

    cp ${SERVICE_NAME}.ini /etc/supervisord.d/
    ###change the install dir base on param $1###
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/supervisord.d/${SERVICE_NAME}.ini
}

start_app() {
    ###if supervisor service started, we need use "supervisorctl update" to start new conf####
    supervisorctl update
    supervisorctl status ${SERVICE_NAME}:0
    if [ $? -eq 0 ]
    then
        echo "${SERVICE_NAME} service start success..."
        return 0
    fi
    echo "${SERVICE_NAME} service start fail, please check log"
    exit 1
}

deploy() {
    source_virtualenv
    init_conf
    start_app
}

deploy
