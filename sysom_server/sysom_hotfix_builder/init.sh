########################################
# install packages
########################################
yum install nfs-utils rpcbind -y || exit 1
systemctl start rpcbind && systemctl enable rpcbind || exit 1
systemctl start nfs-server && systemctl enable nfs-server || exit 1

yum install -y make gcc patch bison flex openssl-devel elfutils elfutils-devel dwarves || exit 1

yum install -y docker git || exit 1

if [ "$APP_NAME" == "" ]
then
    export APP_NAME="sysom"
fi

if [ "$APP_HOME" == "" ]
then
    export APP_HOME=/usr/local/sysom/
    export SERVER_HOME=/usr/local/sysom/server
    export NODE_HOME=/usr/local/sysom/node
fi

if [ "$BUILDER_LOCAL_IP" == "" ]
then
    local_ip=`ip -4 route | grep "link src" | awk -F"link src " '{print $2}' | awk '{print $1}' | head -n 1`
    export BUILDER_LOCAL_IP=$local_ip
fi

if [ "$BUILDER_PUBLIC_IP" == "" ]
then
    export BUILDER_PUBLIC_IP=$BUILDER_LOCAL_IP
fi

if [ "$SERVER_PORT" == "" ]
then
    export SERVER_PORT=80
fi

###################################################################
# Mount the NFS from local directory to server
# NFS_SERVER_IP : The IP of NFS Server
# HOTFIX_NFS_HOME: The NFS directory of server
# LOCAL_HOTFIX_HOME : The local nfs direcotry of builder you choose to mount
###################################################################
NFS_SERVER_IP=127.0.0.1
HOTFIX_NFS_HOME=${SERVER_HOME}/hotfix_builder/hotfix-nfs
LOCAL_NFS_HOME=${SERVER_HOME}/builder/hotfix

export LOCAL_NFS_HOME

if [[ ! -d ${LOCAL_NFS_HOME} ]]; then
    mkdir -p ${LOCAL_NFS_HOME}
fi

sudo umount $LOCAL_NFS_HOME
sudo mount -t nfs ${NFS_SERVER_IP}:${HOTFIX_NFS_HOME} ${LOCAL_NFS_HOME} || exit 1

