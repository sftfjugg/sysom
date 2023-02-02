#!/bin/bash -x
GRAFANA_CONFIG=/etc/grafana/grafana.ini
GRAFANA_ORIG_CONFIG=/usr/share/grafana/conf/sample.ini

cp -f $GRAFANA_ORIG_CONFIG $GRAFANA_CONFIG
systemctl restart grafana-server
