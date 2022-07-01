#!/bin/bash

mkdir -p /usr/local/sysom/monitor/
pushd ../
cp grafana-8.2.5-1.x86_64.rpm prometheus-2.29.1.linux-amd64.tar.gz node_exporter-1.2.2.linux-amd64.tar.gz /usr/local/sysom/monitor/
popd
