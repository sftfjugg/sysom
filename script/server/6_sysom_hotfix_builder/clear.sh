#!/bin/bash
SERVICE_NAME=sysom-hotfix-builder

clear_app() {
    LOCAL_NFS_HOME=${SERVER_HOME}/builder/hotfix
    sed -i '/hotfix_builder/d' /etc/exports

    # kill all kpatch-build process
    echo "find : `ps -eo comm,pid | grep "kpatch-build"`"
    for each_line in `ps -eo comm,pid | grep "kpatch-build"`; do
        echo $each_line
        if [[ $each_line =~ "kpatch-build" ]]; then
                echo "find kpatch-build"
        else
                kill -9 $each_line
        fi
    done

    umount $LOCAL_NFS_HOME
    rm -rf /etc/supervisord.d/${SERVICE_NAME}.ini
    ###use supervisorctl update to stop and clear services###
    supervisorctl update
}

clear_app
