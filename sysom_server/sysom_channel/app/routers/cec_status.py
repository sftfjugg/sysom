# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                config.py
Description:
"""
from fastapi import APIRouter
from starlette.responses import PlainTextResponse
from prometheus_client import CollectorRegistry, generate_latest, Gauge
from cec_base.admin import dispatch_admin
from conf.settings import *

router = APIRouter()

registry = CollectorRegistry()
gauge_lag = Gauge(
    "cec_consume_status_lag",
    "Number of messages stacked in the partition LAG (number of events"
    "that have been submitted to the partition, but not consumed or "
    "acknowledged by a consumer in the current consumer group)",
    ['topic', "consumer_group", "partition"],
    registry=registry
)
gauge_length = Gauge(
    "cec_consume_status_length",
    "Total number of events stored in the partition (both consumed "
    "and unconsumed)",
    ['topic', "consumer_group", "partition"],
    registry=registry
)


@router.get("/metrics")
async def get_consume_status():
    with dispatch_admin(SYSOM_CEC_URL) as admin:
        topic_list = await admin.get_topic_list_async()
        for topic_meta in topic_list:
            items = await admin.get_consume_status_async(
                topic_meta.topic_name
            )
            for item in items:
                gauge_lag.labels(
                    topic=item.topic, consumer_group=item.consumer_group_id,
                    partition=item.partition
                ).set(item.lag)
                gauge_length.labels(
                    topic=item.topic, consumer_group=item.consumer_group_id,
                    partition=item.partition
                ).set(item.total_event_count)
        response = PlainTextResponse(generate_latest(registry))
        gauge_lag.clear()
        gauge_length.clear()
        return response
