#! /bin/sh
yum install nfs-utils rpcbind -y
systemctl start rpcbind && systemctl enable rpcbind
systemctl start nfs && systemctl enable nfs
if [ $? -ne 0 ];then
    systemctl start nfs-server && systemctl enable nfs-server
fi

nfs_mask=`ip -4 route | grep "link src" | grep $SERVER_LOCAL_IP | awk '{print $1}' | head -n 1`
file_path=${SERVER_HOME}/vmcore/vmcore-nfs
mkdir -p ${file_path}
echo "${file_path} ${nfs_mask}(rw,async)" >> /etc/exports
exportfs -rv
chmod -R 777 ${file_path}

cp parse_panic.py ${SERVER_HOME}/vmcore
cp vmcore_const.py ${SERVER_HOME}/vmcore
echo "* * * * * pushd ${SERVER_HOME}/vmcore;python3 parse_panic.py ${file_path};popd" >> /var/spool/cron/root
