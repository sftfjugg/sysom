#!/bin/bash -x
configure_cron()
{
    sed -i '/prometheus/s;^#;;g' /etc/exports
}

main()
{
    configure_cron
    systemctl start grafana-server
    systemctl start prometheus
    systemctl start influxdb
}

main
