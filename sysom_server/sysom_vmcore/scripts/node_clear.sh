#!/bin/bash -x
RESOURCE_DIR=${NODE_HOME}/${SERVICE_NAME}

main()
{
    systemctl disable vmcore-collect.service
    rm -f /usr/lib/systemd/system/vmcore-collect.service
    systemctl daemon-reload
    rm -rf ${RESOURCE_DIR}
    exit 0
}

main
