#!/bin/bash -x

GAFANA_CONFIG=/etc/grafana/grafana.ini

##modify grafana.ini
sed 's/;allow_embedding = false/allow_embedding = true/g' -i $GAFANA_CONFIG
sed 's/;disable_login_form = false/disable_login_form = true/g' -i $GAFANA_CONFIG
sed '/enable anonymous access/{n;s/;enabled = false/enabled = true/;}' -i $GAFANA_CONFIG
sed 's/;root_url = %(protocol)s:\/\/%(domain)s:%(http_port)s\//root_url = %(protocol)s:\/\/%(domain)s\/grafana\//g' -i $GAFANA_CONFIG


##login grafana, and get cookie
curl --location --request POST 'http://127.0.0.1:3000/login' --header 'Content-Type: application/json' \
--data '{"user": "admin", "password": "admin"}' -c cookie

##api key
#curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/auth/keys' --header 'Content-Type: application/json' \
#--data '{"name": "test_key", "role": "Admin", "secondsToLive": 120}' > api_key.json

#api_key=`cat api_key.json | awk -F"\"" '{print $(NF-1)}'`

##initial database
curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/datasources' \
--header 'Content-Type: application/json' \
--data '{"name": "sysom-prometheus", "type": "prometheus", "url": "http://127.0.0.1:9090","access": "proxy", "isDefault": true}'

##initial sysom-dashborad
curl -c cookie -b cookie --location --request POST 'http://127.0.0.1:3000/api/dashboards/db' \
--header 'Content-Type: application/json' \
-d @"sysom-dashboard.json"

rm -f cookie
systemctl restart grafana-server
