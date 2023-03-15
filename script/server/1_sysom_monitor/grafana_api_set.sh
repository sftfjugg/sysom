#!/bin/bash -x
GRAFANA_CONFIG=/etc/grafana/grafana.ini
GRAFANA_SAMPLE_CONFIG=/usr/share/grafana/conf/sample.ini
SYSOM_CONF=${SERVER_HOME}/target/conf/config.yml
GRAFANA_SERVER=grafana-server

##fix sometime grafana.ini not found##
if [ ! -f $GRAFANA_CONFIG ]
then
    echo "sysom grafana: $GRAFANA_CONFIG file not found"
    mkdir -p /etc/grafana
    cp $GRAFANA_SAMPLE_CONFIG $GRAFANA_CONFIG
fi

###grafana configure mysql###
SYSOM_DATABASE_HOST=`cat $SYSOM_CONF | grep -Pzo '(?s)mysql.*n.*database:(.*?)\n' | grep -a host | awk '{print $2}'`
SYSOM_DATABASE_PORT=`cat $SYSOM_CONF | grep -Pzo '(?s)mysql.*n.*database:(.*?)\n' | grep -a port | awk '{print $2}'`
SYSOM_DATABASE_USER=`cat $SYSOM_CONF | grep -Pzo '(?s)mysql.*n.*database:(.*?)\n' | grep -a user | awk '{print $2}'`
SYSOM_DATABASE_PASSWORD=`cat $SYSOM_CONF | grep -Pzo '(?s)mysql.*n.*database:(.*?)\n' | grep -a password | awk '{print $2}'`
##modify grafana.ini
sed -i 's/;type\ =\ sqlite3/type\ =\ mysql/g' $GRAFANA_CONFIG
####If the password contains # or ; you have to wrap it with triple quotes. Ex """#password;"""
sed -i "/;user = root/{n;n;s/;password =/password = \"\"\"$SYSOM_DATABASE_PASSWORD\"\"\"/g}" $GRAFANA_CONFIG
sed -i 's/;name = grafana/name = grafana/g' $GRAFANA_CONFIG
sed -i "s/;user = root/user = $SYSOM_DATABASE_USER/g" $GRAFANA_CONFIG
sed -i "s/;host = 127.0.0.1:3306/host = $SYSOM_DATABASE_HOST:$SYSOM_DATABASE_PORT/g" $GRAFANA_CONFIG
sed 's/disable_login_form = true/;disable_login_form = false/g' -i $GRAFANA_CONFIG

systemctl restart $GRAFANA_SERVER
sleep 3
systemctl status $GRAFANA_SERVER 2>/dev/null
if [ $? -ne 0 ]
then
    echo "grafana server is not active, check status after 10 seconds"
    sleep 10
    systemctl status $GRAFANA_SERVER
    if [ $? -ne 0 ]
    then
        echo "$GRAFANA_SERVER is not running, exit and revert the grafana.ini"
        exit 1
    fi
fi

##login grafana, and get cookie
curl --location --request POST 'http://127.0.0.1:3000/login' --header 'Content-Type: application/json' \
--data '{"user": "admin", "password": "admin"}' -c cookie
if [ $? -ne 0 ]
then
    echo "grafana login error"
    exit 1
fi
##api key
#curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/auth/keys' --header 'Content-Type: application/json' \
#--data '{"name": "test_key", "role": "Admin", "secondsToLive": 120}' > api_key.json

#api_key=`cat api_key.json | awk -F"\"" '{print $(NF-1)}'`

##initial database
curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/datasources' \
--header 'Content-Type: application/json' \
--data '{"name": "sysom-prometheus", "type": "prometheus", "url": "http://127.0.0.1:9090","access": "proxy", "isDefault": true}'
if [ $? -ne 0 ]
then
    echo "grafana configure prometheus datasource error"
    exit 1
fi

curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/datasources' \
--header 'Content-Type: application/json' \
--data '{"name": "sysom-mysql", "type": "mysql", "url": "localhost:3306","access": "proxy", "user":"sysom", "database": "sysom", "secureJsonData": {"password": "sysom_admin"}}'
if [ $? -ne 0 ]
then
    echo "grafana configure prometheus datasource error"
    exit 1
fi

# curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/datasources' \
# --header 'Content-Type: application/json' \
# --data '{"name":"sysom-influxdb","type":"influxdb","access":"proxy","url":"http://localhost:8086","user":"admin","database":"sysom_monitor","secureJsonData":{"password":"sysom_admin"}}'
#if [ $? -ne 0 ]
#then
#    echo "grafana configure influxdb datasource error"
#    exit 1
#fi


##initial sysom-dashborad
curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/dashboards/db' \
--header 'Content-Type: application/json' \
-d @"sysom-dashboard.json"
if [ $? -ne 0 ]
then
    echo "grafana configure dashboard error"
    exit 1
fi

curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/dashboards/db' \
--header 'Content-Type: application/json' \
-d @"sysom-migration-dashboard.json"
if [ $? -ne 0 ]
then
    echo "grafana configure sysom-migration-dashboard error"
    exit 1
fi

curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/dashboards/db' \
--header 'Content-Type: application/json' \
-d @"sysom-cec-status-dashboard.json"
if [ $? -ne 0 ]
then
    echo "grafana configure sysom-cec-status-dashboard error"
    exit 1
fi



#curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/dashboards/db' \
#--header 'Content-Type: application/json' \
#-d @"sysom-netinfo-dashboard.json"
#if [ $? -ne 0 ]
#then
#    echo "grafana configure dashboard error"
#    exit 1
#fi


rm -f cookie

##modify grafana.ini
sed 's/;allow_embedding = false/allow_embedding = true/g' -i $GRAFANA_CONFIG
sed 's/;disable_login_form = false/disable_login_form = true/g' -i $GRAFANA_CONFIG
sed '/enable anonymous access/{n;s/;enabled = false/enabled = true/;}' -i $GRAFANA_CONFIG
sed 's/;root_url = %(protocol)s:\/\/%(domain)s:%(http_port)s\//root_url = %(protocol)s:\/\/%(domain)s\/grafana\//g' -i $GRAFANA_CONFIG

systemctl restart $GRAFANA_SERVER
