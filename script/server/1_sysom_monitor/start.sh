#!/bin/bash -x
SERVICE_NAME=sysom-prometheus
configure_cron()
{
    sed -i '/prometheus/s;^#;;g' /etc/exports
}

main()
{
    configure_cron
    systemctl start grafana-server
    systemctl start influxdb
    supervisorctl start $SERVICE_NAME
}

main
