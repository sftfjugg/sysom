#!/bin/bash -x
disable_cron()
{
    sed -i '/prometheus/d' /var/spool/cron/root 
}

main()
{
    systemctl stop grafana-server
    systemctl stop prometheus
    disable_cron
}

main
