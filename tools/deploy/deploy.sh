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

export APP_HOME=${APP_HOME}
export SERVER_HOME=${APP_HOME}/server
export NODE_HOME=${APP_HOME}/node
export SERVER_LOCAL_IP=${SERVER_LOCAL_IP}
export SERVER_PUBLIC_IP=${SERVER_PUBLIC_IP}
export SERVER_PORT=${SERVER_PORT}

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
    cp -r ${SERVER_DIR} ${WEB_DIR} ${TARGET_PATH}
    cp -r ${SCRIPT_DIR} ${APP_HOME}/init_scripts
}

init_conf() {
    mkdir -p /run/daphne
    mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
    cp tools/deploy/nginx.conf /etc/nginx/
    cp tools/deploy/sysom.conf /etc/nginx/conf.d/
    cp tools/deploy/sysom*ini /etc/supervisord.d/
    ###change the install dir base on param $1###
    sed -i "s;SERVER_PORT;${SERVER_PORT};g" /etc/nginx/conf.d/sysom.conf
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/nginx/conf.d/sysom.conf
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/supervisord.d/sysom*ini
    cp tools/deploy/sysom-server.service /usr/lib/systemd/system/
    cpu_num=`cat /proc/cpuinfo | grep processor | wc -l`
    sed -i "s/threads = 3/threads = $cpu_num/g" ${TARGET_PATH}/${DIAGNOSIS_DIR}/conf/diagnosis_gunicorn.py
    sed -i "s/threads = 3/threads = $cpu_num/g" ${TARGET_PATH}/${CHANNEL_DIR}/conf/channel_gunicorn.py
}

start_script_server() {
   systemctl daemon-reload
   systemctl start sysom-server.service
}

generate_service_env() {
    rm -f /usr/local/sysom/env
    cat << EOF > /usr/local/sysom/env
APP_HOME=${APP_HOME}
SERVER_HOME=${APP_HOME}/server
NODE_HOME=${APP_HOME}/node
SERVER_LOCAL_IP=${SERVER_LOCAL_IP}
SERVER_PUBLIC_IP=${SERVER_PUBLIC_IP}
SERVER_PORT=${SERVER_PORT}
EOF
}

deploy() {
    touch_env_rpms
    update_target
    init_conf
    generate_service_env
    start_script_server
}

deploy
