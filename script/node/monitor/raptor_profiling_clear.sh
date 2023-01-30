#!/bin/bash -x
RESOURCE_DIR=${NODE_HOME}/monitor

main()
{
    systemctl stop raptor
    rm -f /usr/lib/systemd/system/raptor.service
    rm -rf ${RESOURCE_DIR}/raptor
    exit 0
}

main
