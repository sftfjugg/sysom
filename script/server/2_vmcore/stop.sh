#!/bin/bash
SERVICE_NAME=sysom-vmcore
stop_app() {
    sed -i '/vmcore/d' /var/spool/cron/root
    sed -i '/vmcore/d' /etc/exports
    exportfs -rv
    systemctl stop nfs-server
    systemctl stop rpcbind
    systemctl stop nfs
    supervisorctl stop $SERVICE_NAME
}

stop_app
