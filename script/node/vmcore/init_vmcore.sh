#! /bin/sh
yum install nfs-utils rpcbind -y
systemctl start rpcbind && systemctl enable rpcbind
systemctl start nfs && systemctl enable nfs

VMCORE_HOME=${NODE_HOME}/vmcore
VMCORE_NFS_HOME=${SERVER_HOME}/vmcore/vmcore-nfs
NODE_CONF=${APP_HOME}/conf
mkdir -p ${VMCORE_HOME}

service="
[Unit]
Description=Collect vmcore file to oss
After=network.target network-online.target remote-fs.target basic.target
DefaultDependencies=no

[Service]
Type=forking
ExecStart=/usr/bin/python3 ${VMCORE_HOME}/vmcore_collect.py ${SERVER_LOCAL_IP} ${VMCORE_NFS_HOME} ${NODE_CONF}
StartLimitInterval=0
StandardOutput=syslog
StandardError=inherit

[Install]
WantedBy=multi-user.target
"

cat << EOF > vmcore-collect.service
$service
EOF

cp vmcore_collect.py ${VMCORE_HOME}
mv vmcore-collect.service /usr/lib/systemd/system/vmcore-collect.service
chmod 644 /usr/lib/systemd/system/vmcore-collect.service
systemctl daemon-reload
systemctl enable vmcore-collect.service
