#!/bin/bash -x
SERVICE_NAME=sysom-prometheus

disable_cron()
{
    sed -i '/prometheus/s;^;#;g' /var/spool/cron/root
}

main()
{
    systemctl stop grafana-server
    supervisorctl stop $SERVICE_NAME
    systemctl stop influxdb
    disable_cron
}

main
