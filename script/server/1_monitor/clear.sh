#!/bin/bash -x
disable_cron()
{
    sed -i '/prometheus/d' /var/spool/cron/root 
}

main()
{
    systemctl stop grafana-server
    yum erase -y grafana
    ##del grafana runtime conf
    rm -rf /etc/grafana/
    systemctl stop prometheus
    systemctl disable prometheus
    rm -f /usr/lib/systemd/system/prometheus.service

    systemctl stop influxdb
    yum erase -y influxdb
    disable_cron
}

main
