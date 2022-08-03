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
SCRIPT_DIR="script"

if [ $# != 3 ] ; then
    echo "USAGE: $0 INSTALL_DIR Internal_IP EXTERNAL_IP"
    echo " e.g.: $0 /usr/local/sysom 192.168.0.100 120.26.xx.xx"
    exit 1
fi

APP_HOME=$1
SERVER_LOCAL_IP=$2
SERVER_PUBLIC_IP=$3
SERVER_HOME=${APP_HOME}/server

export APP_HOME=${APP_HOME}
export SERVER_HOME=${APP_HOME}/server
export NODE_HOME=${APP_HOME}/node
export SERVER_LOCAL_IP=${SERVER_LOCAL_IP}
export SERVER_PUBLIC_IP=${SERVER_PUBLIC_IP}

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
    rpm -q --quiet wget || yum install -y wget
    rpm -q --quiet rpcbind || yum install -y rpcbind
    rpm -q --quiet nfs-utils || yum install -y nfs-utils
    rpm -q --quiet python3-pip || yum install -y python3-pip
}

update_target() {
    if [ -d "${TARGET_PATH}" ]; then
        rm -rf ${TARGET_PATH}
    fi
    mkdir -p ${TARGET_PATH}
    echo "INFO: copy project file..."
    cp -r ${API_DIR} ${WEB_DIR} ${TARGET_PATH}
    cp -r ${SCRIPT_DIR} ${APP_HOME}/init_scripts
}

init_conf() {
    mkdir -p /run/daphne
    cp tools/deploy/nginx.conf /etc/nginx/
    cp tools/deploy/sysom.conf /etc/nginx/conf.d/
    sed -i "s;/home/sysom;${SERVER_HOME};g" /etc/nginx/conf.d/sysom.conf
    cp tools/deploy/sysom.ini /etc/supervisord.d/
    sed -i "s;/home/sysom;${SERVER_HOME};g" /etc/supervisord.d/sysom.ini
    cp tools/deploy/sysom-server.service /usr/lib/systemd/system/
}

start_script_server() {
   systemctl daemon-reload
   systemctl start sysom-server.service
}

deploy() {
    touch_env_rpms
    update_target
    init_conf
    start_script_server
}

deploy
