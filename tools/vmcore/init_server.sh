#! /bin/sh
yum install nfs-utils rpcbind -y
systemctl start rpcbind && systemctl enable rpcbind
systemctl start nfs && systemctl enable nfs

if [ "$#" -ge 2 ]; then
    file_path=$(readlink -f $1)
    mkdir $file_path
    echo "$file_path $2(rw,async)" >> /etc/exports
    exportfs -rv
    chmod -R 777 $file_path
else
    mkdir /usr/vmcore-nfs
    echo "/usr/vmcore-nfs 172.16.139.0/24(rw,async)" >> /etc/exports
    exportfs -rv
    chmod -R 777 /usr/vmcore-nfs
fi
