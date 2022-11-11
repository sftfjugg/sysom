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
SDK_DIR=$SERVER_DIR/sdk
WEB_DIR="sysom_web"

VIRTUALENV_HOME="${SERVER_HOME}/virtualenv"
TARGET_PATH="${SERVER_HOME}/target"

if [ "$UID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

mkdir -p ${SERVER_HOME}

check_selinux_status()
{
    ###check selinux rpm###
    rpm -qa | grep selinux-policy
    if [ $? -eq 0 ]
    then
        cat /etc/selinux/config  | grep "SELINUX=disabled"
        if [ $? -eq 0 ]
        then
            echo "selinux disable..."
        else
            echo "selinux enable, please set selinux disable"
            exit 1
        fi
    else
        echo "selinux rpm package not install"
    fi
}

touch_virtualenv() {
    mkdir -p ~/.pip
    cp pip.conf ~/.pip/
    if [ -d ${VIRTUALENV_HOME} ]; then
        echo "virtualenv exists, skip"
    else
        virtualenv-3  ${VIRTUALENV_HOME}
        if [ "$?" = 0 ]; then
            echo "INFO: create virtualenv success"
        else
            echo "ERROR: create virtualenv failed"
            exit 1
        fi
    fi
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

check_requirements() {
    echo "INFO: begin install requirements..."

    if ! [ -d ${SERVER_HOME}/logs/ ]; then
        mkdir -p ${SERVER_HOME}/logs/ || exit 1
    fi

    local requirements_log="${SERVER_HOME}/logs/${APP_NAME}_requirements.log"
    local requirements="requirements.txt"
    touch "$requirements_log" || exit
    pip install pytest-runner cffi requests
    pip install -r ${requirements} -i "${ALIYUN_MIRROR}" |tee -a "${requirements_log}" || exit 1
    local pip_res=$?
    if [ $pip_res -ne 0 ]; then
        echo "ERROR: requirements not satisfied and auto install failed, please check ${requirements_log}"
        exit 1
    fi
}

setup_database() {
    echo "INFO: begin create db..."

    systemctl restart mariadb.service
    systemctl enable mariadb.service
    mysql -uroot -e "create user if not exists 'sysom'@'%' identified by 'sysom_admin';"
    mysql -uroot -e "grant usage on *.* to 'sysom'@'localhost' identified by 'sysom_admin'"
    mysql -uroot -e "drop database if exists sysom;"
    mysql -uroot -e "create database sysom character set utf8;"
    mysql -uroot -e "create database grafana character set utf8;"
    mysql -uroot -e "grant all privileges on sysom.* to 'sysom'@'%';"
    mysql -uroot -e "grant all privileges on grafana.* to 'sysom'@'%';"
    mysql -uroot -e "flush privileges;"
}

init_conf() {
    mkdir -p /run/daphne
    pushd ${TARGET_PATH}/${API_DIR}
    rm -f apps/*/migrations/00*.py
    python manage.py makemigrations accounts
    python manage.py makemigrations host
    python manage.py makemigrations vmcore
    python manage.py makemigrations task
    python manage.py makemigrations monitor
    python manage.py makemigrations alarm
    python manage.py makemigrations vul
    python manage.py makemigrations channel
    python manage.py migrate
    popd

    pushd ${TARGET_PATH}/${DIAGNOSIS_DIR}
    rm -f apps/*/migrations/00*.py
    python manage.py makemigrations task
    python manage.py migrate
    popd


    pushd ${TARGET_PATH}/${CHANNEL_DIR}
    rm -f apps/*/migrations/00*.py
    python manage.py makemigrations channel
    python manage.py migrate
    popd
}

install_sdk() {
    pushd ${TARGET_PATH}/${SDK_DIR}
    python setup_cec_base.py develop
    python setup_cec_redis.py develop
    python setup_channel_job.py develop
    sudo rm -r *.egg-info build dist
    popd
}

start_app() {
    systemctl enable nginx.service
    systemctl enable redis.service
    systemctl enable supervisord.service
    systemctl restart nginx.service
    systemctl restart redis.service
    systemctl restart supervisord.service
}

deploy() {
    check_selinux_status
    touch_virtualenv
    check_requirements
    install_sdk
    setup_database | tee -a ${SERVER_HOME}/logs/${APP_NAME}_setup_database.log 2>&1
    init_conf
    start_app
}

deploy
