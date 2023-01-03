#! /bin/bash
NODE_INIT_DIR=${SERVER_HOME}/target/sysom_web/download/sysom_node_init
SERVER_DIR="sysom_server"
VMCORE_DIR=${SERVER_DIR}/sysom_vmcore
VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
TARGET_PATH=${SERVER_HOME}/target
SERVICE_NAME=sysom-vmcore
VIRTUALENV_PYTHON3=${SERVER_HOME}/virtualenv/bin/python3

BASE_DIR=`dirname $0`

source_virtualenv() {
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

init_conf() {
    pushd ${TARGET_PATH}/${VMCORE_DIR}
    python manage.py migrate
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

start_nfs()
{
    systemctl start rpcbind && systemctl enable rpcbind
    systemctl start nfs && systemctl enable nfs
    if [ $? -ne 0 ];then
        systemctl start nfs-server && systemctl enable nfs-server
    fi

    nfs_mask=`ip -4 route | grep "link src" | grep $SERVER_LOCAL_IP | awk '{print $1}' | head -n 1`
    file_path=${SERVER_HOME}/vmcore/vmcore-nfs
    mkdir -p ${file_path}
    echo "${file_path} ${nfs_mask}(rw,async)" >> /etc/exports
    exportfs -rv
    chmod -R 777 ${file_path}
}

start_cron()
{
    cp parse_panic.py ${SERVER_HOME}/vmcore
    cp vmcore_const.py ${SERVER_HOME}/vmcore
    echo "* * * * * pushd ${SERVER_HOME}/vmcore;${VIRTUALENV_PYTHON3} parse_panic.py ${file_path} ${SERVER_PORT};popd" >> /var/spool/cron/root
}

prepare_node_init_tar()
{
    mkdir -p ${NODE_INIT_DIR}
    cp -r ${BASE_DIR}/../../node/vmcore ${NODE_INIT_DIR}
}

deploy() {
    prepare_node_init_tar
    source_virtualenv
    init_conf
    start_app
    start_nfs
    start_cron
}

deploy
