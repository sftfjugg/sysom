# -*- coding: utf-8 -*- #
"""
Time                2022/10/11 16:13
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                apps.py
Description:
"""

from sdk.cec_base.consumer import Consumer
from sdk.cec_base.log import LoggerHelper, LoggerLevel
from .executor import TaskExecutor
from .conf import *

if __name__ == '__main__':
    LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_INFO)
    task_executor = TaskExecutor(
        SYSOM_CEC_URL,
        SYSOM_CEC_TASK_DELIVERY_TOPIC,
        Consumer.generate_consumer_id(),
        SYSOM_CEC_TASK_DELIVERY_GROUP,
        SYSOM_CEC_TASK_RESULT_PROCESS_TOPIC
    )
    task_executor.start()
    task_executor.join()