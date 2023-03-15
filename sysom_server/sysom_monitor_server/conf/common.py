# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                common.py
Description:
"""
from cec_base.log import LoggerHelper, LoggerLevel
import sys
from pathlib import Path
from sysom_utils import ConfigParser

# sysom_monitor_server root path
BASE_DIR = Path(__file__).resolve().parent.parent

##################################################################
# Load yaml config first
##################################################################
YAML_GLOBAL_CONFIG_PATH = f"{BASE_DIR.parent.parent}/conf/config.yml"
YAML_SERVICE_CONFIG_PATH = f"{BASE_DIR}/config.yml"

YAML_CONFIG = ConfigParser(YAML_GLOBAL_CONFIG_PATH, YAML_SERVICE_CONFIG_PATH)

##################################################################
# Cec settings
##################################################################
# channl_job SDK 需要的url
CHANNEL_JOB_URL = YAML_CONFIG.get_local_channel_job_url()


##################################################################
# Logger settings
##################################################################
# Config log format
log_format = YAML_CONFIG.get_server_config().logger.format
LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO,
                 format=log_format, colorize=True)
LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING,
                 format=log_format, colorize=True)
