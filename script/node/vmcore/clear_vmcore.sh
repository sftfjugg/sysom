#! /bin/sh

systemctl disable vmcore-collect.service
rm -f /usr/lib/systemd/system/vmcore-collect.service
systemctl daemon-reload
rm -rf ${VMCORE_HOME}
