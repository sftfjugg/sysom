#!/bin/bash -x

RESOURCE_DIR=${NODE_HOME}/monitor

##设置raptor开机自动启动
cat << EOF > raptor.service
[Unit]
Description=SysOM Monitor Prometheus
Documentation=SysOM Monitor Prometheus
Wants=network-online.target
After=network-online.target

[Service]
ExecStart=/usr/bin/sysak raptor oncpu --server http://${SERVER_LOCAL_IP}:4040 --app-name ${NODE_IP}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

main()
{
    mv raptor.service /usr/lib/systemd/system
    systemctl daemon-reload
    systemctl enable raptor
    systemctl start raptor
    ps -elf | grep "${RESOURCE_DIR}/raptor/raptor" | grep -v grep 1>/dev/null
    if [ $? -ne 0 ]
    then
        exit 1
    fi
    exit 0
}

main
