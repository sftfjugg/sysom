#!/bin/bash -x

RESOURCE_DIR=${NODE_HOME}/monitor

main()
{
    systemctl stop node_exporter
    rm -f /usr/lib/systemd/system/node_exporter.service
    rm -rf ${RESOURCE_DIR}/node_exporter
    bash -x raptor_profiling_clear.sh
    exit 0
}

main
