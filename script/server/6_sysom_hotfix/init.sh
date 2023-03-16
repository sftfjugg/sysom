#! /bin/bash
SERVER_DIR="sysom_server"
HOTFIX_DIR=${SERVER_DIR}/sysom_hotfix
VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
TARGET_PATH=${SERVER_HOME}/target
SERVICE_NAME=sysom-hotfix

source_virtualenv() {
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

init_conf() {
    pushd ${TARGET_PATH}/${HOTFIX_DIR}
    python manage.py migrate
    popd

    cp ${SERVICE_NAME}.ini /etc/supervisord.d/
    ###change the install dir base on param $1###
    sed -i "s;/usr/local/sysom;${APP_HOME};g" /etc/supervisord.d/${SERVICE_NAME}.ini
    cpu_num=`cat /proc/cpuinfo | grep processor | wc -l`
    sed -i "s/threads = 3/threads = $cpu_num/g" ${TARGET_PATH}/${HOTFIX_DIR}/conf/hotfix_gunicorn.py
}

start_nfs()
{
    systemctl start rpcbind && systemctl enable rpcbind
    systemctl start nfs && systemctl enable nfs
    if [ $? -ne 0 ];then
        systemctl start nfs-server && systemctl enable nfs-server
    fi

    nfs_mask=`ip -4 route | grep "link src" | grep $SERVER_LOCAL_IP | awk '{print $1}' | head -n 1`
    file_path=${SERVER_HOME}/hotfix_builder/hotfix-nfs
    mkdir -p ${file_path}
    echo "${file_path} ${nfs_mask}(rw,async)" >> /etc/exports
    exportfs -rv
    chmod -R 777 ${file_path}
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
    start_nfs
}

deploy
