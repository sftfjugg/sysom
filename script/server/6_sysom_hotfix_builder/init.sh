#! /bin/bash
SERVER_DIR="sysom_server"
HOTFIX_BUILDER_DIR=${SERVER_DIR}/sysom_hotfix_builder
VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
SERVICE_NAME=sysom-hotfix-builder
NFS_SERVER_IP=${SERVER_LOCAL_IP}

source_virtualenv() {
    echo "INFO: activate virtualenv..."
    source ${VIRTUALENV_HOME}/bin/activate || exit 1
}

init_conf() {
    cp ${SERVICE_NAME}.ini /etc/supervisord.d/
}

install_package() {

    rpm -q --quiet make gcc patch bison flex openssl-devel elfutils elfutils-devel dwarves || yum install -y make gcc patch bison flex openssl-devel elfutils elfutils-devel dwarves || exit 1

    rpm -q --quiet docker git || yum install -y docker git || echo "Warngin : Docker is not installed in this machine!"
}

mount_nfs()
{
    HOTFIX_NFS_HOME=${SERVER_HOME}/hotfix_builder/hotfix-nfs
    LOCAL_NFS_HOME=${SERVER_HOME}/builder/hotfix

    mkdir -p ${LOCAL_NFS_HOME}

    sudo umount $LOCAL_NFS_HOME # Remove the mounted directory in case it mounted before
    sudo mount -t nfs ${NFS_SERVER_IP}:${HOTFIX_NFS_HOME} ${LOCAL_NFS_HOME} || exit 1
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
    install_package
    mount_nfs
    start_app
}

deploy
