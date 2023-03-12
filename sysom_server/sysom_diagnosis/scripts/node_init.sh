#!/bin/bash -x

RESOURCE_DIR=${NODE_HOME}/${SERVICE_NAME}
SYSAK_VER=1.3.0-2
SYSAK_ARCH=x86_64
SYSAK_PKG=sysak-${SYSAK_VER}.${SYSAK_ARCH}.rpm

main()
{
    ###we need to update the sysak rpm###
    rpm -qa | grep sysak
    if [ $? -eq 0 ]
    then
        yum erase -y `rpm -qa | grep sysak`
    fi

    yum install -y ${SYSAK_PKG}
    exit $?
}

main
