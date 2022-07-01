#!/bin/bash -x

RESOURCE_DIR=$1/monitor

disable_prometheus()
{
    systemctl stop prometheus
    systemctl disable prometheus
}

disable_grafana()
{
    systemctl stop grafana-server
    systemctl disable grafana-server
}

uninstall_pkg()
{
    rm -f /usr/lib/systemd/system/prometheus.service
    rm -rf $RESOURCE_DIR/prometheus
    yum erase -y grafana.x86_64
    rm -rf /usr/share/grafana
    rm -rf /var/lib/grafana
    rm -rf /var/logre/grafana
    rm -rf /etc/grafana
}

main()
{
    disable_prometheus
    disable_grafana
    uninstall_pkg
}

main
