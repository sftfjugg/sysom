#!/bin/bash -x

RESOURCE_DIR=${NODE_HOME}/${SERVICE_NAME}

##设置node_exporter开机自动启动
cat << EOF > node_exporter.service
[Unit]
Description=SysOM Monitor Prometheus
Documentation=SysOM Monitor Prometheus
Wants=network-online.target
After=network-online.target

[Service]
ExecStart=${RESOURCE_DIR}/node_exporter/node_exporter
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

main()
{
    NODE_EXPORTER_PKG=`ls node_exporter-*.tar.gz | awk -F".tar.gz" '{print $1}'`
    NODE_EXPORTER_TAR=${NODE_EXPORTER_PKG}.tar.gz
    tar -zxvf ${NODE_EXPORTER_TAR}
    rm -rf ${RESOURCE_DIR}/node_exporter
    mkdir -p ${RESOURCE_DIR}
    echo 1 ${NODE_EXPORTER_PKG}
    mv ${NODE_EXPORTER_PKG} ${RESOURCE_DIR}/node_exporter
    echo 2 ${RESOURCE_DIR}/node_exporter
    mv node_exporter.service /usr/lib/systemd/system
    systemctl daemon-reload
    systemctl enable node_exporter
    systemctl start node_exporter
    ps -elf | grep "${RESOURCE_DIR}/node_exporter/node_exporter" | grep -v grep 1>/dev/null
    if [ $? -ne 0 ]
    then
        exit 1
    fi
    bash -x raptor_profiling_deploy.sh
    exit 0
}

main
