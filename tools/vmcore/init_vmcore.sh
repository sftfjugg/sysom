#! /bin/sh
yum install nfs-utils rpcbind -y
systemctl start rpcbind && systemctl enable rpcbind
systemctl start nfs && systemctl enable nfs

make
cp vmcore_collect /usr/bin
cp vmcore_collect.conf.example /etc/vmcore_collect.conf 
cp vmcore-collect.service /usr/lib/systemd/system/vmcore-collect.service
chmod 644 /usr/lib/systemd/system/vmcore-collect.service
systemctl daemon-reload
systemctl enable vmcore-colect.service
systemctl start  vmcore-collect.service
