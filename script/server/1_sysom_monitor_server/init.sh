#!/bin/bash
SERVER_DIR="sysom_server"
CHANNEL_DIR=${SERVER_DIR}/sysom_monitor_server
VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
TARGET_PATH=${SERVER_HOME}/target
SERVICE_NAME=sysom-monitor-server

if [ "$UID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

source_virtualenv() {
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

init_conf() {
    pushd ${TARGET_PATH}/${CHANNEL_DIR}
    alembic upgrade head
    popd

    cp ${SERVICE_NAME}.ini /etc/supervisord.d/
    ###change the install dir base on param $1###
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/supervisord.d/${SERVICE_NAME}.ini
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

deploy() {
    source_virtualenv
    init_conf
    start_app
}

deploy
