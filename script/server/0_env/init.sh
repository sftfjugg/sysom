#!/bin/bash
#****************************************************************#
# ScriptName: init sysom env
# Author: huangtuquan
#***************************************************************#

ALIYUN_MIRROR="https://mirrors.aliyun.com/pypi/simple/"
SERVER_DIR="sysom_server"
SDK_DIR=$SERVER_DIR/sdk

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

touch_env_rpms() {
    if [ -f /etc/alios-release ]; then
        if [ ! -f /etc/yum.repos.d/epel.repo ]; then
            wget -O /etc/yum.repos.d/epel.repo http://mirrors.aliyun.com/repo/epel-7.repo
        fi
    elif [ -f /etc/anolis-release ]; then
        sed -i '/epel\/8\/Everything/{n;s/enabled=0/enabled=1/;}' /etc/yum.repos.d/AnolisOS-DDE.repo
    fi
    rpm -q --quiet python3 || yum install -y python3
    rpm -q --quiet mariadb-server || yum install -y mariadb-server
    rpm -q --quiet supervisor || yum install -y supervisor
    rpm -q --quiet nginx || yum install -y nginx
    rpm -q --quiet gcc || yum install -y gcc
    rpm -q --quiet make || yum install -y make
    rpm -q --quiet redis || yum install -y redis
    rpm -q --quiet wget || yum install -y wget
    rpm -q --quiet rpcbind || yum install -y rpcbind
    rpm -q --quiet nfs-utils || yum install -y nfs-utils
}

check_requirements() {
    echo "INFO: begin install requirements..."
    if ! [ -d ${SERVER_HOME}/logs/ ]; then
        mkdir -p ${SERVER_HOME}/logs/ || exit 1
    fi

    local requirements_log="${SERVER_HOME}/logs/${APP_NAME}_requirements.log"
    local requirements="requirements.txt"
    touch "$requirements_log" || exit
    ### atomic-0.7.3 need cffi, we show install cffi first###
    pip install --upgrade pip
    pip install cffi
    pip install -r ${requirements} -i "${ALIYUN_MIRROR}" |tee -a "${requirements_log}" || exit 1
    local pip_res=$?
    if [ $pip_res -ne 0 ]; then
        echo "ERROR: requirements not satisfied and auto install failed, please check ${requirements_log}"
        exit 1
    fi
}

touch_virtualenv() {
    if [ -d ${VIRTUALENV_HOME} ]; then
        echo "virtualenv exists, skip"
        echo "INFO: activate virtualenv..."
        source ${VIRTUALENV_HOME}/bin/activate || exit 1
    else
        mkdir -p ~/.pip
        cp pip.conf ~/.pip/
        python3 -m venv ${VIRTUALENV_HOME}
        if [ "$?" = 0 ]; then
            echo "INFO: create virtualenv success"
        else
            echo "ERROR: create virtualenv failed"
            exit 1
        fi
        echo "INFO: activate virtualenv..."
        source ${VIRTUALENV_HOME}/bin/activate || exit 1
        check_requirements
    fi
}

install_sdk() {
    pushd ${TARGET_PATH}/${SDK_DIR}
    python setup_cec_base.py develop
    python setup_cec_redis.py develop
    python setup_channel_job.py develop
    python setup_sysom_utils.py develop
    sudo rm -r *.egg-info build dist
    popd
}

deploy() {
    check_selinux_status
    touch_env_rpms
    touch_virtualenv
    install_sdk
}

deploy
