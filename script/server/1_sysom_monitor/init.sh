#!/bin/bash -x
NODE_INIT_DIR=${SERVER_HOME}/target/sysom_web/download/sysom_node_init
RESOURCE_DIR=${SERVER_HOME}/monitor
ARCH=`uname -p`
GRAFANA_PKG=grafana-9.2.2-1.${ARCH}.rpm
PROMETHEUS_VER=2.29.1
PROMETHEUS_ARCH=linux-amd64
if [ "${ARCH}" == "aarch64" ]
then
    PROMETHEUS_ARCH=linue-arm64
fi
PROMETHEUS_PKG=prometheus-${PROMETHEUS_VER}.${PROMETHEUS_ARCH}
PROMETHEUS_TAR=$PROMETHEUS_PKG.tar.gz
NODE_EXPORTER_VER=1.5.0
NODE_EXPORTER_PKG=node_exporter-${NODE_EXPORTER_VER}.${PROMETHEUS_ARCH}
NODE_EXPORTER_TAR=$NODE_EXPORTER_PKG.tar.gz
OSS_URL=https://sysom.oss-cn-beijing.aliyuncs.com/monitor
GRAFANA_DL_URL=https://dl.grafana.com/oss/release
PROMETHEUS_DL_URL=https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VER}
NODE_DL_URL=https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VER}
NODE_INIT_SCRIPT=${SERVER_HOME}/target/sysom_server/sysom_diagnosis/service_scripts/node_init
NODE_DELETE_SCRIPT=${SERVER_HOME}/target/sysom_server/sysom_diagnosis/service_scripts/node_delete
SERVICE_NAME=sysom-prometheus
VIRTUALENV_PYTHON3=${SERVER_HOME}/virtualenv/bin/python3

BASE_DIR=`dirname $0`

start_grafana_service()
{
    systemctl daemon-reload
    systemctl enable grafana-server
    systemctl start grafana-server
}

install_grafana()
{
    echo "install grafana......"

    pushd ${RESOURCE_DIR}
    ls | grep ${GRAFANA_PKG} 1>/dev/null 2>/dev/null
    if [ $? -ne 0 ]
    then
        wget ${OSS_URL}/${GRAFANA_PKG} || wget ${GRAFANA_DL_URL}/${GRAFANA_PKG}
        ls
    fi

    yum install -y ./${GRAFANA_PKG}
    popd
}

install_and_config_influxdb()
{
    # install influxdb
    cat <<EOF | sudo tee /etc/yum.repos.d/influxdb.repo
[influxdb]
name = InfluxDB Repository - RHEL \$releasever
baseurl = https://repos.influxdata.com/rhel/\$releasever/\$basearch/stable
enabled = 1
gpgcheck = 1
gpgkey = https://repos.influxdata.com/influxdb.key
EOF
    rpm -q --quiet influxdb || yum install -y influxdb
    systemctl enable influxdb.service
    systemctl start influxdb.service

    # config influxdb
    influx -execute "create user \"admin\" with password 'sysom_admin'"
    influx -execute "create database sysom_monitor"
}

##configure prometheus.yml to auto discovery new nodes
add_auto_discovery()
{
    pushd ${RESOURCE_DIR}/prometheus
    mkdir -p node

    cat << EOF >> prometheus.yml
  - job_name: 'auto_discovery'
    file_sd_configs:
    - files:
      - "${RESOURCE_DIR}/prometheus/node/node.json"
      refresh_interval: 10s
  - job_name: "cec_monitor"
    metrics_path: "/api/v1/channel/cec_status/metrics"
    static_configs:
      - targets: ["localhost:7003"]
EOF

   popd
   cp prometheus_get_node.py ${RESOURCE_DIR}/prometheus/
}

init_conf() {
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

start_prometheus_service()
{
    add_auto_discovery
    init_conf
    start_app
}

##download and install prometheus
install_prometheus()
{
    echo "install prometheus......"
    pushd ${RESOURCE_DIR}

    rm -rf prometheus

    ls | grep ${PROMETHEUS_TAR} 1>/dev/null 2>/dev/null
    if [ $? -ne 0 ]
    then
        wget ${OSS_URL}/${PROMETHEUS_TAR} || wget ${PROMETHEUS_DL_URL}/${PROMETHEUS_TAR}
        ls
    fi
    tar -zxvf ${PROMETHEUS_TAR}

    ##rename the prometheus directory
    mv ${PROMETHEUS_PKG} prometheus
    popd
}

##download node_exporter pkg
download_node_exporter()
{
    echo "install node_exporter......"
    pushd ${RESOURCE_DIR}
    rm -rf node_exporter

    ls | grep ${NODE_EXPORTER_TAR} 1>/dev/null 2>/dev/null
    if [ $? -ne 0 ]
    then
        echo "wget node_exporter"
        wget ${OSS_URL}/${NODE_EXPORTER_TAR} || wget ${NODE_DL_URL}/${NODE_EXPORTER_TAR}
    fi
    popd

}

prepare_node_init_tar()
{
    mkdir -p ${NODE_INIT_DIR}
    cp -r ${BASE_DIR}/../../node/monitor ${NODE_INIT_DIR}
    cp ${RESOURCE_DIR}/${NODE_EXPORTER_TAR} ${NODE_INIT_DIR}/monitor/
}

set_node_init_cmd()
{
    sed "s#server_local_ip='xxx'#server_local_ip=\"${SERVER_LOCAL_IP}\"#g" -i ${NODE_INIT_SCRIPT}
    sed "s#server_public_ip='xxx'#server_public_ip=\"${SERVER_PUBLIC_IP}\"#g" -i  ${NODE_INIT_SCRIPT}
    sed "s#server_port='xxx'#server_port=\"${SERVER_PORT}\"#g" -i  ${NODE_INIT_SCRIPT}
    sed "s#app_home='xxx'#app_home=\"${APP_HOME}\"#g" -i ${NODE_INIT_SCRIPT}
    sed "s#node_home='xxx'#node_home=\"${NODE_HOME}\"#g" -i ${NODE_DELETE_SCRIPT}
}


configure_grafana()
{
    bash -x grafana_api_set.sh
    if [ $? -ne 0 ]
    then
        echo "grafana configure fail, recover the grafana config file now"
        bash -x grafana_recover.sh
        exit 1
    fi
}

configure_cron()
{
    echo "* * * * * ${VIRTUALENV_PYTHON3} ${RESOURCE_DIR}/prometheus/prometheus_get_node.py ${SERVER_PORT}" >> /var/spool/cron/root
    echo "* * * * * sleep 30;${VIRTUALENV_PYTHON3} ${RESOURCE_DIR}/prometheus/prometheus_get_node.py ${SERVER_PORT}" >> /var/spool/cron/root
}

main()
{
    echo "perpare download resource packages: grafana, prometheus, node_exporter"
    mkdir -p ${RESOURCE_DIR}
    install_grafana
    install_prometheus
    # download_node_exporter

    start_grafana_service
    start_prometheus_service

    set_node_init_cmd
    #prepare_node_init_tar

    configure_grafana
    configure_cron

    # install_and_config_influxdb
}

main
