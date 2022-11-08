#!/bin/bash
#****************************************************************#
# ScriptName: clear.sh
# Function: clear sysom
#***************************************************************#
APP_HOME=/usr/local/sysom

if [ $# -lt 1 ] ; then
    echo "USAGE: $0 INSTALL_DIR"
    echo "Or we use default install dir: /usr/local/sysom/"
    echo "E.g.: $0 /usr/local/sysom"
else
    APP_HOME=$1
fi

export APP_HOME=${APP_HOME}

del_app_home() {
    rm -rf ${APP_HOME}
}

del_conf() {
    mv /etc/nginx/nginx.conf.bak /etc/nginx/nginx.conf
    rm -f /etc/nginx/conf.d/sysom.conf
    rm -f /etc/supervisord.d/sysom.ini
    rm -f /etc/supervisord.d/diagnosis-service.ini
    rm -f /etc/supervisord.d/channel-service.ini
    rm -f /usr/lib/systemd/system/sysom-server.service
}

stop_server() {
   systemctl stop sysom-server.service
   systemctl disable sysom-server.service
   systemctl daemon-reload
}

clear_server() {
   bash -x ${APP_HOME}/init_scripts/server/clear.sh
}


clear() {
    stop_server
    clear_server
    del_conf
    del_app_home
}

clear
