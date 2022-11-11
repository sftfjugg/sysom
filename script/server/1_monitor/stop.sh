#!/bin/bash -x
disable_cron()
{
    sed -i '/prometheus/d' /var/spool/cron/root 
}

main()
{
    systemctl stop grafana-server
    systemctl stop prometheus
    systemctl stop influxdb
    disable_cron
}

main
