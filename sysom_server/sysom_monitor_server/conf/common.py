# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                common.py
Description:
"""
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
