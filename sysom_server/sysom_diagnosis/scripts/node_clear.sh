#!/bin/bash -x
RESOURCE_DIR=${NODE_HOME}/${SERVICE_NAME}

main()
{
    yum erase -y `rpm -qa | grep sysak`
    rm -rf ${RESOURCE_DIR}
    exit 0
}

main
