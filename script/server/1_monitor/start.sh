#!/bin/bash -x
configure_cron()
{
    echo "* * * * * python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 10;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 20;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 30;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 40;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
    echo "* * * * * sleep 50;python3 $RESOURCE_DIR/prometheus/prometheus_get_node.py" ${SERVER_HOME} >> /var/spool/cron/root
}

main()
{
    configure_cron
    systemctl start grafana-server
    systemctl start prometheus
}

main
