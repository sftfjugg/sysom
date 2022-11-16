#!/bin/bash
#****************************************************************#
# ScriptName: deploy.sh
# Author: algalon
# Create Date: 2021-11-13 22:42
# Modify Date: 2021-11-16 00:02
# Function: deploy sysom
#***************************************************************#

ALIYUN_MIRROR="https://mirrors.aliyun.com/pypi/simple/"
APP_NAME="sysom"
SERVER_DIR="sysom_server"
API_DIR=$SERVER_DIR/sysom_api
DIAGNOSIS_DIR=$SERVER_DIR/sysom_diagnosis
CHANNEL_DIR=$SERVER_DIR/sysom_channel
VMCORE_DIR=$SERVER_DIR/sysom_vmcore
SDK_DIR=$SERVER_DIR/sdk
WEB_DIR="sysom_web"

VIRTUALENV_HOME="${SERVER_HOME}/virtualenv"
TARGET_PATH="${SERVER_HOME}/target"

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
    rm -f apps/*/migrations/00*.py
    python manage.py makemigrations accounts
    python manage.py makemigrations host
    python manage.py makemigrations alarm
    python manage.py makemigrations vul
    python manage.py migrate
    popd

    pushd ${TARGET_PATH}/${DIAGNOSIS_DIR}
    rm -f apps/*/migrations/00*.py
    python manage.py makemigrations task
    python manage.py migrate
    popd

    pushd ${TARGET_PATH}/${CHANNEL_DIR}
    alembic upgrade head
    popd

    pushd ${TARGET_PATH}/${VMCORE_DIR}
    rm -f apps/*/migrations/00*.py
    python manage.py makemigrations vmcore
    python manage.py migrate
    popd
}

start_app() {
    systemctl enable supervisord.service
    systemctl restart supervisord.service
}

deploy() {
    source_virtualenv
    init_conf
    start_app
}

deploy
