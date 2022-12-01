#!/bin/bash
SERVICE_NAME=sysom-vmcore
clear_app() {
    sed -i '/vmcore/d' /var/spool/cron/root
    sed -i '/vmcore/d' /etc/exports
    exportfs -rv
    systemctl stop nfs-server
    systemctl stop rpcbind
    systemctl stop nfs
    rm -rf /etc/supervisord.d/${SERVICE_NAME}.ini
    ###use supervisorctl update to stop and clear services###
    supervisorctl update
}

clear_app
