#!/bin/bash -x

RESOURCE_DIR=/usr/local/sysom/monitor
NODE_EXPORTER_VER=1.2.2
NODE_EXPORTER_ARCH=linux-amd64
NODE_EXPORTER_PKG=node_exporter-${NODE_EXPORTER_VER}.${NODE_EXPORTER_ARCH}
NODE_EXPORTER_TAR=$NODE_EXPORTER_PKG.tar.gz

##设置node_exporter开机自动启动
cat << EOF > node_exporter.service
[Unit]
Description=SysOM Monitor Promethues
Documentation=SysOM Monitor Promethues
Wants=network-online.target
After=network-online.target

[Service]
ExecStart=${RESOURCE_DIR}/node_exporter/node_exporter

[Install]
WantedBy=multi-user.target
EOF

main()
{
    tar -zxvf $NODE_EXPORTER_TAR
    rm -rf $RESOURCE_DIR/node_exporter
    mv $NODE_EXPORTER_PKG $RESOURCE_DIR/node_exporter
    mv node_exporter.service /usr/lib/systemd/system
    systemctl daemon-reload
    systemctl enable node_exporter
    systemctl start node_exporter
    ps -elf | grep "/usr/local/sysom/monitor/node_exporter/node_exporter" | grep -v grep 1>/dev/null
    if [ $? -ne 0 ]
    then
        exit 1
    fi
    exit 0
}

main
