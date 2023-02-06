#!/bin/bash
SERVICE_NAME=sysom-hotfix-builder

clear_app() {
    LOCAL_NFS_HOME=${SERVER_HOME}/builder/hotfix
    umount $LOCAL_NFS_HOME
    rm -rf /etc/supervisord.d/${SERVICE_NAME}.ini
    ###use supervisorctl update to stop and clear services###
    supervisorctl update
}

clear_app
