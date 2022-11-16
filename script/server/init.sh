#!/bin/bash -x

FIRST_INIT_DONE=0

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
if [ "$SERVER_LOCAL_IP" == "" ]
then
	local_ip=`ip -4 route | grep "link src" | awk -F"link src " '{print $2}' | awk '{print $1}' | head -n 1`
	export SERVER_LOCAL_IP=$local_ip
fi

if [ "$SERVER_PUBLIC_IP" == "" ]
then
	export SERVER_PUBLIC_IP=$SERVER_LOCAL_IP
fi

if [ "$SERVER_PORT" == "" ]
then
       export SERVER_PORT=80
fi

basedir=`dirname $0`

cd $basedir

if [ $FIRST_INIT_DONE == 0 ]
then
	for dir in `ls`
	do
		if [ -d $dir ]
		then
			pushd $dir
			bash -x init.sh || exit 1
			popd
		fi
	done
	sed -i 's/^FIRST_INIT_DONE=0/FIRST_INIT_DONE=1/g' $0
else
	for dir in `ls`
	do
		if [ -d $dir ]
		then
			pushd $dir
			bash -x start.sh
			popd
		fi
	done
fi
