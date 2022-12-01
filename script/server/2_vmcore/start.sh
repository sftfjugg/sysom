#!/bin/bash
SERVICE_NAME=sysom-vmcore
start_app() {
    systemctl start nfs-server
    systemctl start rpcbind
    systemctl start nfs
    sed -i '/vmcore/s;^#;;g' /var/spool/cron/root
    sed -i '/vmcore/s;^#;;g' /etc/exports
    exportfs -rv
    supervisorctl start $SERVICE_NAME
}

start_app
