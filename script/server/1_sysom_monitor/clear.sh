#!/bin/bash -x
SERVICE_NAME=sysom-prometheus
del_cron()
{
    sed -i '/prometheus/d' /var/spool/cron/root 
}

main()
{
    systemctl stop grafana-server
    yum erase -y grafana
    ##del grafana runtime conf
    rm -rf /etc/grafana/

    rm -rf /etc/supervisord.d/${SERVICE_NAME}.ini
    ###use supervisorctl update to stop and clear services###
    supervisorctl update

    systemctl stop influxdb
    yum erase -y influxdb
    del_cron
}

main
