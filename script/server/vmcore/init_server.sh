#! /bin/sh
yum install nfs-utils rpcbind -y
systemctl start rpcbind && systemctl enable rpcbind
systemctl start nfs && systemctl enable nfs
if [ $? -ne 0 ];then
    systemctl start nfs-server && systemctl enable nfs-server
fi

internal_net_seg=`echo ${SERVER_LOCAL_IP} | awk -F"." '{print $1"."$2"."$3}'`
file_path=${APP_HOME}/vmcore/vmcore-nfs
mkdir -p ${file_path}
echo "${file_path} ${internal_net_seg}.0/24(rw,async)" >> /etc/exports
exportfs -rv
chmod -R 777 ${file_path}

cp parse_panic.py ${APP_HOME}/vmcore
cp vmcore_const.py ${APP_HOME}/vmcore
echo "* * * * * pushd ${APP_HOME}/vmcore;python3 parse_panic.py ${file_path};popd" >> /var/spool/cron/root
