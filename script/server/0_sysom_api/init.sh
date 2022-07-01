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
API_DIR="sysom_api"
WEB_DIR="sysom_web"

VIRTUALENV_HOME="${SERVER_HOME}/virtualenv"
TARGET_PATH="${SERVER_HOME}/target"

if [ "$UID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

mkdir -p ${SERVER_HOME}

touch_env_rpms() {
    if [ -f /etc/alios-release ]; then
        if [ ! -f /etc/yum.repos.d/epel.repo ]; then
            wget -O /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo
        fi
    elif [ -f /etc/anolis-release ]; then
        sed -i '/epel\/8\/Everything/{n;s/enabled=0/enabled=1/;}' /etc/yum.repos.d/AnolisOS-DDE.repo
    fi
    rpm -q --quiet python3 || yum install -y python3
    rpm -q --quiet python3-virtualenv || yum install -y python3-virtualenv
    rpm -q --quiet mariadb-server || yum install -y mariadb-server
    rpm -q --quiet supervisor || yum install -y supervisor
    rpm -q --quiet nginx || yum install -y nginx
    rpm -q --quiet gcc || yum install -y gcc
    rpm -q --quiet make || yum install -y make
    rpm -q --quiet redis || yum install -y redis
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


update_target() {
    if [ -d "${TARGET_PATH}" ]; then
        rm -rf ${TARGET_PATH}
    fi
    mkdir -p ${TARGET_PATH}
    echo "INFO: copy project file..."
    cp -r ${API_DIR} ${WEB_DIR} ${TARGET_PATH}

}

check_requirements() {
    echo "INFO: begin install requirements..."

    if ! [ -d ${SERVER_HOME}/logs/ ]; then
        mkdir -p ${SERVER_HOME}/logs/ || exit 1
    fi

    local requirements_log="${SERVER_HOME}/logs/${APP_NAME}_requirements.log"
    local requirements="requirements.txt"
    touch "$requirements_log" || exit
    pip install pytest-runner cffi
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
    mysql -uroot -e "grant all privileges on sysom.* to 'sysom'@'%';"
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
    python manage.py migrate
    python manage.py loaddata ./apps/accounts/user.json
    python manage.py loaddata ./apps/alarm/subscribe.json
    python manage.py loaddata ./apps/vmcore/vmcore.json
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
#    touch_env_rpms
    touch_virtualenv
#    update_target
    check_requirements
    setup_database | tee -a ${SERVER_HOME}/logs/${APP_NAME}_setup_database.log 2>&1
    init_conf
    start_app
}

deploy
