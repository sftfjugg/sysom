#!/bin/bash
SERVICE_NAME=sysom-channel
clear_app() {
    rm -rf /etc/supervisord.d/${SERVICE_NAME}.ini 
    ###use supervisorctl update to stop and clear services###
    supervisorctl update
}
clear_app
