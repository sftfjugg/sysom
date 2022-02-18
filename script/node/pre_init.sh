#!/bin/bash -x

UPLOAD_DIR=${APP_HOME}/target/sysom_web/download/
APP_CMD_CONF=${APP_HOME}/target/sysom_api/conf/product.py
RESOURCE_DIR=${APP_HOME}/monitor
PROMETHEUS_ARCH=linux-amd64
NODE_EXPORTER_VER=1.2.2
NODE_EXPORTER_PKG=node_exporter-${NODE_EXPORTER_VER}.${PROMETHEUS_ARCH}
NODE_EXPORTER_TAR=$NODE_EXPORTER_PKG.tar.gz
NODE_INIT_DIR=sysom_node_init
NODE_INIT_PKG=sysom_node_init.tar.gz
NODE_INIT_CMD="CLIENT_DEPLOY_CMD = 'rm -rf /tmp/sysom; mkdir -p /tmp/sysom;cd /tmp/sysom;wget http://${SERVER_IP}/download/${NODE_INIT_PKG};tar -xf ${NODE_INIT_PKG};bash -x ${NODE_INIT_DIR}/init.sh'"

BASE_DIR=`dirname $0`

init_monitor()
{
    cp ${RESOURCE_DIR}/${NODE_EXPORTER_TAR} monitor/
}

prepare_init_tar()
{
    rm -f conf
    echo "APP_HOME=${APP_HOME}" >> conf
    echo "SERVER_IP=${SERVER_IP}" >> conf
    mkdir -p ../${NODE_INIT_DIR}
    cp -r * ../${NODE_INIT_DIR}
    rm -f ../${NODE_INIT_DIR}/pre_init.sh
    tar -zvcf ../${NODE_INIT_PKG} ../${NODE_INIT_DIR}
    rm -rf ../${NODE_INIT_DIR}
    mv ../${NODE_INIT_PKG} ${UPLOAD_DIR}
}

set_node_init_cmd()
{
    echo ${NODE_INIT_CMD} >> ${APP_CMD_CONF}
}

pre_init()
{
    pushd ${BASE_DIR}
    init_monitor
    prepare_init_tar
    set_node_init_cmd
    popd
}

main()
{
    pre_init
}

main
