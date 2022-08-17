# -*- coding: utf-8 -*- #
"""
Time                2022/8/2 17:40
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                log.py
Description:
"""
import sys
from enum import Enum
from loguru import logger

# 移除默认的输出到终端的 sink => 默认不打印日志
logger.remove()

# 使用 lazy_logger 打印的日志会根据当前 sink 的日志等级过滤
# 1. 比如当前日志等级为 INFO，则所有日志等级小于 INFO 的日志都将被过滤；
lazy_logger = logger.opt(lazy=True)


class LoggerLevel(Enum):
    """日志等级枚举类"""
    LOGGER_LEVEL_TRACE = "TRACE"
    LOGGER_LEVEL_DEBUG = "DEBUG"
    LOGGER_LEVEL_INFO = "INFO"
    LOGGER_LEVEL_SUCCESS = "SUCCESS"
    LOGGER_LEVEL_WARNING = "WARNING"
    LOGGER_LEVEL_ERROR = "ERROR"
    LOGGER_LEVEL_CRITICAL = "CRITICAL"


class LoggerHelper:
    """日志辅助类"""

    # 使用 lazy_logger 打印的日志会根据当前 sink 的日志等级过滤
    # 1. 比如当前日志等级为 INFO，则所有日志等级小于 INFO 的日志都将被过滤
    _lazy_logger = logger.opt(lazy=True)

    # 记录 stdout 日志的句柄
    _stdout_logger_handle_id = None

    @staticmethod
    def _update_lazy_logger():
        """Update lazy_logger
        """
        LoggerHelper._lazy_logger = logger.opt(lazy=True)

    @staticmethod
    def update_sys_stdout_sink(level: LoggerLevel):
        """Update the level of sys.stdout

        Args:
            level(LoggerLevel): New Level

        Returns:

        """
        logger.remove(LoggerHelper._stdout_logger_handle_id)
        LoggerHelper._stdout_logger_handle_id = logger.add(sys.stdout,
                                                           colorize=True,
                                                           level=level.value)
        LoggerHelper._update_lazy_logger()
        return LoggerHelper

    @staticmethod
    def add(sink: str, level: LoggerLevel, **kwargs):
        """Add new sink

        详情参考：https://github.com/Delgan/loguru

        Args:
            sink(str): New sink path
            level(LoggerLevel): The log level of new sink
            kwargs: Other params define in loguru
        """
        kwargs['level'] = level.value
        logger.add(sink, **kwargs)
        LoggerHelper._update_lazy_logger()

    @staticmethod
    def get_lazy_logger():
        """Get lazy_logger

        Returns:
            loguru.Logger: The lazy logger

        """
        return LoggerHelper._lazy_logger
