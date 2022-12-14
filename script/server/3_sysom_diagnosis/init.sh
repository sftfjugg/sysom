#!/bin/bash
NODE_INIT_DIR=${SERVER_HOME}/target/sysom_web/download/sysom_node_init
SERVER_DIR="sysom_server"
TARGET_PATH=${SERVER_HOME}/target
DIAGNOSIS_DIR=${SERVER_DIR}/sysom_diagnosis
VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
SERVICE_NAME=sysom-diagnosis
SYSAK_DOWNLOAD_URL=https://mirrors.openanolis.cn/sysak/packages/
SYSAK_VERSION=sysak-1.3.0-2.x86_64.rpm

BASE_DIR=`dirname $0`

source_virtualenv() {
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

init_conf() {
    pushd ${TARGET_PATH}/${DIAGNOSIS_DIR}
    rm -f apps/*/migrations/00*.py
    python manage.py makemigrations task
    python manage.py migrate
    popd

    cp ${SERVICE_NAME}.ini /etc/supervisord.d/
    ###change the install dir base on param $1###
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/supervisord.d/${SERVICE_NAME}.ini
    cpu_num=`cat /proc/cpuinfo | grep processor | wc -l`
    sed -i "s/threads = 3/threads = $cpu_num/g" ${TARGET_PATH}/${DIAGNOSIS_DIR}/conf/diagnosis_gunicorn.py
}

start_app() {
    ###if supervisor service started, we need use "supervisorctl update" to start new conf####
    supervisorctl update
    supervisorctl status ${SERVICE_NAME}
    if [ $? -eq 0 ]
    then
        echo "supervisorctl start ${SERVICE_NAME} success..."
        return 0
    fi
    echo "${SERVICE_NAME} service start fail, please check log"
    exit 1
}

prepare_node_init_tar()
{
    mkdir -p ${NODE_INIT_DIR}
    cp -r ${BASE_DIR}/../../node/diagnosis ${NODE_INIT_DIR}
    pushd ${NODE_INIT_DIR}/diagnosis
    wget -T 3 -t 1 ${SYSAK_DOWNLOAD_URL}/${SYSAK_VERSION}
    popd
}

deploy() {
    prepare_node_init_tar
    source_virtualenv
    init_conf
    start_app
}

deploy
