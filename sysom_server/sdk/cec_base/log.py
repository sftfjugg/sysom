# -*- coding: utf-8 -*- #
"""
Time                2022/7/26 10:20
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                log.py
Description:

This file provides a log printing interface to the CEC, providing basic
printing functionality and masking the log library used by the underlying
"""
import sys
from enum import Enum
from loguru import logger

# Remove default output to terminal sink => no logs printed by default
logger.remove()


class LoggerLevel(Enum):
    """ An enum class that defines the log level
    """
    LOGGER_LEVEL_TRACE = "TRACE"
    LOGGER_LEVEL_DEBUG = "DEBUG"
    LOGGER_LEVEL_INFO = "INFO"
    LOGGER_LEVEL_SUCCESS = "SUCCESS"
    LOGGER_LEVEL_WARNING = "WARNING"
    LOGGER_LEVEL_ERROR = "ERROR"
    LOGGER_LEVEL_CRITICAL = "CRITICAL"


class LoggerHelper:
    """A logging helper class

    """

    # Logs printed with lazy_logger are filtered according to the current
    # sink's log level
    # 1. for example, if the current log level is INFO, then all logs with a
    #    log level less than INFO will be filtered.
    _lazy_logger = logger.opt(lazy=True)

    # Handle to log stdout logs
    _stdout_logger_handle_id = None

    @staticmethod
    def _update_lazy_logger():
        """Update lazy_logger
        """
        LoggerHelper._lazy_logger = logger.opt(lazy=True)

    @staticmethod
    def update_sys_stdout_sink(level: LoggerLevel):
        """Update the level of 'sys.stdout'

        Args:
            level(LoggerLevel): New Level

        Returns:

        """
        logger.remove(LoggerHelper._stdout_logger_handle_id)
        LoggerHelper._stdout_logger_handle_id = logger.add(
            sys.stdout,
            colorize=True,
            level=level.value
        )
        LoggerHelper._update_lazy_logger()
        return LoggerHelper

    @staticmethod
    def add(sink: str, level: LoggerLevel, **kwargs):
        """Add new sink

        Args:
            sink(str): New sink path
            level(LoggerLevel): The log level of new sink
            kwargs: Other params define in loguru

        References:
            https://github.com/Delgan/loguru
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
