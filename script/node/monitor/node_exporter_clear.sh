#!/bin/bash -x

RESOURCE_DIR=${APP_HOME}/monitor

main()
{
    systemctl stop node_exporter
    rm -f /usr/lib/systemd/system/node_exporter.service
    rm -rf ${RESOURCE_DIR}/node_exporter
    exit 0
}

main
