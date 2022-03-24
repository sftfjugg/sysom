#!/bin/bash -x

NODE_HOME=${APP_HOME}/node
UPLOAD_DIR=${APP_HOME}/target/sysom_web/download/
APP_CMD_CONF=${APP_HOME}/target/sysom_api/conf/product.py
NODE_INIT_SCRIPT=${APP_HOME}/target/sysom_api/service_scripts/node_init
NODE_DELETE_SCRIPT=${APP_HOME}/target/sysom_api/service_scripts/node_delete
RESOURCE_DIR=${APP_HOME}/monitor
PROMETHEUS_ARCH=linux-amd64
NODE_EXPORTER_VER=1.2.2
NODE_EXPORTER_PKG=node_exporter-${NODE_EXPORTER_VER}.${PROMETHEUS_ARCH}
NODE_EXPORTER_TAR=$NODE_EXPORTER_PKG.tar.gz
NODE_INIT_DIR=sysom_node_init
NODE_INIT_PKG=sysom_node_init.tar.gz

BASE_DIR=`dirname $0`

init_monitor()
{
    cp ${RESOURCE_DIR}/${NODE_EXPORTER_TAR} monitor/
}

prepare_init_tar()
{
    rm -f conf
    echo "APP_HOME=${APP_HOME}" >> conf
    echo "NODE_HOME=${NODE_HOME}" >> conf
    echo "SERVER_LOCAL_IP=${SERVER_LOCAL_IP}" >> conf
    echo "SERVER_PUBLIC_IP=${SERVER_PUBLIC_IP}" >> conf
    mkdir -p ../${NODE_INIT_DIR}
    cp -r * ../${NODE_INIT_DIR}
    rm -f ../${NODE_INIT_DIR}/pre_init.sh
    tar -zvcf ../${NODE_INIT_PKG} ../${NODE_INIT_DIR}
    rm -rf ../${NODE_INIT_DIR}
    mv ../${NODE_INIT_PKG} ${UPLOAD_DIR}
}

set_node_init_cmd()
{
    sed "s#server_local_ip=xxx#server_local_ip=\"${SERVER_LOCAL_IP}\"#" -i ${NODE_INIT_SCRIPT}
    sed "s#server_public_ip=xxx#server_public_ip=\"${SERVER_PUBLIC_IP}\"#" -i  ${NODE_INIT_SCRIPT}
    sed "s#app_home=xxx#app_home=\"${APP_HOME}\"#" -i ${NODE_INIT_SCRIPT}
    sed "s#node_home=xxx#node_home=\"${NODE_HOME}\"#" -i ${NODE_INIT_SCRIPT}
    sed "s#app_home=xxx#app_home=\"${APP_HOME}\"#" -i ${NODE_DELETE_SCRIPT}
    sed "s#node_home=xxx#node_home=\"${NODE_HOME}\"#" -i ${NODE_DELETE_SCRIPT}

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
