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
}

check_requirements() {
    echo "INFO: begin install requirements..."

    if ! [ -d ${SERVER_HOME}/logs/ ]; then
        mkdir -p ${SERVER_HOME}/logs/ || exit 1
    fi

    local requirements_log="${SERVER_HOME}/logs/${APP_NAME}_requirements.log"
    local requirements="requirements.txt"
    touch "$requirements_log" || exit
    pip install -r ${requirements} -i "${ALIYUN_MIRROR}" |tee -a "${requirements_log}" || exit 1
    local pip_res=$?
    if [ $pip_res -ne 0 ]; then
        echo "ERROR: requirements not satisfied and auto install failed, please check ${requirements_log}"
        exit 1
    fi
}

install_sdk() {
    pushd ${TARGET_PATH}/${SDK_DIR}
    python setup_cec_base.py develop
    python setup_cec_redis.py develop
    python setup_channel_job.py develop
    sudo rm -r *.egg-info build dist
    popd
}

deploy() {
    check_selinux_status
    touch_virtualenv
    check_requirements
    install_sdk
}

deploy
