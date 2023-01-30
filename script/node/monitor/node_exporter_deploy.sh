#!/bin/bash -x

RESOURCE_DIR=${NODE_HOME}/monitor
NODE_EXPORTER_VER=1.2.2
NODE_EXPORTER_ARCH=linux-amd64
NODE_EXPORTER_PKG=node_exporter-${NODE_EXPORTER_VER}.${NODE_EXPORTER_ARCH}
NODE_EXPORTER_TAR=${NODE_EXPORTER_PKG}.tar.gz

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
    tar -zxvf ${NODE_EXPORTER_TAR}
    rm -rf ${RESOURCE_DIR}/node_exporter
    mkdir -p ${RESOURCE_DIR}
    mv ${NODE_EXPORTER_PKG} ${RESOURCE_DIR}/node_exporter
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
