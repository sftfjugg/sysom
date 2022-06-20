#!/bin/bash -x

UPLOAD_DIR=${SERVER_HOME}/target/sysom_web/download/
RESOURCE_DIR=${SERVER_HOME}/monitor
GRAFANA_PKG=grafana-8.2.5-1.x86_64.rpm
PROMETHEUS_VER=2.29.1
PROMETHEUS_ARCH=linux-amd64
PROMETHEUS_PKG=prometheus-${PROMETHEUS_VER}.${PROMETHEUS_ARCH}
PROMETHEUS_TAR=$PROMETHEUS_PKG.tar.gz
NODE_EXPORTER_VER=1.2.2
NODE_EXPORTER_PKG=node_exporter-${NODE_EXPORTER_VER}.${PROMETHEUS_ARCH}
NODE_EXPORTER_TAR=$NODE_EXPORTER_PKG.tar.gz
OSS_URL=https://sysom.oss-cn-beijing.aliyuncs.com/monitor
GRAFANA_DL_URL=https://dl.grafana.com/oss/release
PROMETHEUS_DL_URL=https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VER}
NODE_DL_URL=https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VER}

service_head="
[Unit]
Description=SysOM Monitor Promethues
Documentation=SysOM Monitor Promethues
Wants=network-online.target
After=network-online.target

[Service]
"

service_tail="
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"

service_task="ExecStart="

start_grafana_service()
{
    systemctl daemon-reload
    systemctl enable grafana-server
    systemctl start grafana-server
}

install_grafana()
{
    echo "install grafana......"

    pushd $RESOURCE_DIR
    ls | grep $GRAFANA_PKG 1>/dev/null 2>/dev/null
    if [ $? -ne 0 ]
    then
        wget $OSS_URL/$GRAFANA_PKG || wget $GRAFANA_DL_URL/$GRAFANA_PKG
        ls
    fi

    yum install -y $GRAFANA_PKG
    popd
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
EOF

   popd
   cp prometheus_get_node.py ${RESOURCE_DIR}/prometheus/
}

start_prometheus_service()
{
    ##create prometheus service
    prometheus_exec=${RESOURCE_DIR}/prometheus/prometheus
    prometheus_config="--config.file=\"${RESOURCE_DIR}/prometheus/prometheus.yml\""
    prometheus_data="--storage.tsdb.path=\"${RESOURCE_DIR}/prometheus/data/\""
    
    prometheus_service_task="$service_task$prometheus_exec $prometheus_config $prometheus_data"

    cat << EOF > prometheus.service
$service_head
$prometheus_service_task
$service_tail
EOF

    cat prometheus.service

    add_auto_discovery

    mv prometheus.service /usr/lib/systemd/system
    systemctl daemon-reload
    systemctl enable prometheus
    systemctl start prometheus
}

##download and install prometheus
install_prometheus()
{
    echo "install prometheus......"
    pushd $RESOURCE_DIR

    rm -rf prometheus

    ls | grep $PROMETHEUS_TAR 1>/dev/null 2>/dev/null
    if [ $? -ne 0 ]
    then
        wget $OSS_URL/$PROMETHEUS_TAR || wget $PROMETHEUS_DL_URL/$PROMETHEUS_TAR
        ls
    fi
    tar -zxvf $PROMETHEUS_TAR

    ##rename the prometheus directory
    mv $PROMETHEUS_PKG prometheus
    popd
}

##download node_exporter pkg
download_node_exporter()
{
    echo "install node_exporter......"
    pushd $RESOURCE_DIR
    rm -rf node_exporter

    ls | grep $NODE_EXPORTER_TAR 1>/dev/null 2>/dev/null
    if [ $? -ne 0 ]
    then
        echo "wget node_exporter"
        wget $OSS_URL/$NODE_EXPORTER_TAR || wget $NODE_DL_URL/$NODE_EXPORTER_TAR
    fi
    popd

}

configure_grafana()
{
    bash -x grafana_api_set.sh
}

configure_cron()
{
    echo "* * * * * python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 10;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 20;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 30;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 40;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 50;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
}

configure_requests()
{
    yum install -y python3-pip
    pip3 install requests
}

main()
{
    yum install -y wget
    echo "perpare download resource packages: grafana, prometheus, node_exporter"
    mkdir -p $RESOURCE_DIR
#    bash -x local_copy_pkg.sh
    install_grafana
    install_prometheus
    download_node_exporter

    start_grafana_service
    start_prometheus_service
#    start_node_exporter_service

    configure_requests
    configure_grafana
    configure_cron
}

main
