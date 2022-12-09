#!/bin/bash -x

FIRST_INIT_DONE=0

if [ "$APP_NAME" == "" ]
then
    export APP_NAME="sysom"
fi

if [ "$APP_HOME" == "" ]
then
    export APP_HOME=/usr/local/sysom
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

config=conf
basedir=`dirname $0`
SYSOM_CONF=${SERVER_HOME}/target/sysom_server/sysom_api/conf/common.py
SYSOM_DATABASE_HOST=`cat $SYSOM_CONF | grep "'HOST'" | awk -F"'" '{print $4}'`
SYSOM_DATABASE_PORT=`cat $SYSOM_CONF | grep "'PORT'" | awk -F"'" '{print $4}'`
SYSOM_DATABASE_USER=`cat $SYSOM_CONF | grep "'USER'" | awk -F"'" '{print $4}'`
SYSOM_DATABASE_PASSWORD=`cat $SYSOM_CONF | grep PASSWORD | awk -F"'" '{print $4}'`

###enable the service web menu###
setup_web_menu_enable()
{
    service=`echo $1 | grep sysom | awk -F"sysom_" '{print $NF}'`
    if [ "$service" != "" ]
    then
        mysql -h ${SYSOM_DATABASE_HOST} -P ${SYSOM_DATABASE_PORT} -u ${SYSOM_DATABASE_USER} -p${SYSOM_DATABASE_PASSWORD} \
        -e "use sysom;insert into sys_service_info(service_name, created_at) values ('sysom_${service}', current_timestamp);"
    fi
}

cd $basedir

if [ $FIRST_INIT_DONE == 0 ]
then
    for dir in `cat $config`
    do
        if [ -d $dir ]
        then
            pushd $dir
            bash -x init.sh || exit 1
            setup_web_menu_enable $dir
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
