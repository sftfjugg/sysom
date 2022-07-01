#! /bin/sh
sed -i '/vmcore/d' /var/spool/cron/root
sed -i '/vmcore/d' /etc/exports
exportfs -rv
systemctl stop nfs-server
systemctl stop rpcbind
systemctl stop nfs
