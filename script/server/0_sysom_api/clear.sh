#!/bin/bash
clear_db() {
    systemctl start mariadb.service
    mysql -uroot -e "drop database if exists sysom;"
    mysql -uroot -e "drop database if exists grafana;"
}

clear_app() {
    clear_db
}

clear_app
