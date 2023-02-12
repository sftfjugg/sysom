#!/bin/bash
SERVER_DIR="sysom_server"
TARGET_PATH=${SERVER_HOME}/target
MIGRATION_DIR=${SERVER_DIR}/sysom_migration
VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
SERVICE_NAME=sysom-migration
ANCE_PKG=ance-0.1.1-1.x86_64.rpm
ANOLIS_SQLITE=AnolisOS-8.6-x86_64-dvd.iso.sqlite
ANOLIS_MIGRATION_PKGS=anolis_migration_pkgs.tar.gz

if [ "$UID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

source_virtualenv() {
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

init_conf() {
    pushd ${TARGET_PATH}/${MIGRATION_DIR}
    python manage.py migrate
    popd

    cp ${SERVICE_NAME}.ini /etc/supervisord.d/
    ###change the install dir base on param $1###
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/supervisord.d/${SERVICE_NAME}.ini
    cpu_num=`cat /proc/cpuinfo | grep processor | wc -l`
    sed -i "s/threads = 3/threads = $cpu_num/g" ${TARGET_PATH}/${MIGRATION_DIR}/conf/migration_gunicorn.py
}

check_or_download_ance() {
    mkdir -p ${TARGET_PATH}/${MIGRATION_DIR}/ance

    pushd ${TARGET_PATH}/${MIGRATION_DIR}/ance
    if [ ! -f "${ANCE_PKG}" ]; then
        wget "https://ance.oss-cn-hangzhou.aliyuncs.com/release/x86_64/${ANCE_PKG}"
    fi
    if [ ! -f "${ANOLIS_SQLITE}" ]; then
        wget "https://ance.oss-cn-hangzhou.aliyuncs.com/databases/${ANOLIS_SQLITE}"
    fi
    if [ ! -f "${ANOLIS_MIGRATION_PKGS}" ]; then
        wget "https://gitee.com/src-anolis-sig/leapp/releases/download/v1.0.1-all-in-one/${ANOLIS_MIGRATION_PKGS}"
    fi
    popd
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
    check_or_download_ance
    start_app
}

deploy
