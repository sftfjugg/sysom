#!/bin/bash -x
GRAFANA_CONFIG=/etc/grafana/grafana.ini
SYSOM_CONF=${SERVER_HOME}/target/sysom_api/conf/common.py

###grafana configure mysql###
SYSOM_DATABASE_HOST=`cat $SYSOM_CONF | grep "'HOST'" | awk -F"'" '{print $4}'`
SYSOM_DATABASE_PORT=`cat $SYSOM_CONF | grep "'PORT'" | awk -F"'" '{print $4}'`
SYSOM_DATABASE_USER=`cat $SYSOM_CONF | grep "'USER'" | awk -F"'" '{print $4}'`
SYSOM_DATABASE_PASSWORD=`cat $SYSOM_CONF | grep PASSWORD | awk -F"'" '{print $4}'`
##modify grafana.ini
sed -i 's/;type\ =\ sqlite3/type\ =\ mysql/g' $GRAFANA_CONFIG
sed -i "/;user = root/{n;n;s/;password =/password = $SYSOM_DATABASE_PASSWORD/g}" $GRAFANA_CONFIG
sed -i 's/;name = grafana/name = grafana/g' $GRAFANA_CONFIG
sed -i "s/;user = root/user = $SYSOM_DATABASE_USER/g" $GRAFANA_CONFIG
sed -i "s/127.0.0.1:3306/$SYSOM_DATABASE_HOST:$SYSOM_DATABASE_PORT/g" $GRAFANA_CONFIG
systemctl restart grafana-server

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
    echo "grafana configure datasource error"
    exit 1
fi

##initial sysom-dashborad
curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/dashboards/db' \
--header 'Content-Type: application/json' \
-d @"sysom-dashboard.json"
if [ $? -ne 0 ]
then
    echo "grafana configure dashboard error"
    exit 1
fi

rm -f cookie

##modify grafana.ini
sed 's/;allow_embedding = false/allow_embedding = true/g' -i $GRAFANA_CONFIG
sed 's/;disable_login_form = false/disable_login_form = true/g' -i $GRAFANA_CONFIG
sed '/enable anonymous access/{n;s/;enabled = false/enabled = true/;}' -i $GRAFANA_CONFIG
sed 's/;root_url = %(protocol)s:\/\/%(domain)s:%(http_port)s\//root_url = %(protocol)s:\/\/%(domain)s\/grafana\//g' -i $GRAFANA_CONFIG

systemctl restart grafana-server
