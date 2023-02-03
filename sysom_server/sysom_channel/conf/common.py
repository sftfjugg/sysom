# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                common.py
Description:
"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SQLALCHEMY_DATABASE_URL = "mariadb+pymysql://sysom:sysom_admin@127.0.0.1/sysom"

# Static resource dir
STATIC_RESOURCE_PATH = os.path.join(BASE_DIR, "public")
if not os.path.exists(STATIC_RESOURCE_PATH):
    os.makedirs(STATIC_RESOURCE_PATH)

# Temp download dir
TMP_DOWNLOAD_DIR = os.path.join(STATIC_RESOURCE_PATH, "tmp_download_dir")
if not os.path.exists(TMP_DOWNLOAD_DIR):
    os.makedirs(TMP_DOWNLOAD_DIR)


##################################################################
# SSH channel settings
##################################################################
SSH_CHANNEL_KEY_DIR = os.path.join(BASE_DIR.parent, 'conf', 'ssh')
if not os.path.exists(SSH_CHANNEL_KEY_DIR):
    os.makedirs(SSH_CHANNEL_KEY_DIR)
SSH_CHANNEL_KEY_PRIVATE = os.path.join(SSH_CHANNEL_KEY_DIR, "sysom_id")
SSH_CHANNEL_KEY_PUB = os.path.join(SSH_CHANNEL_KEY_DIR, "sysom_id.pub")

##################################################################
# Cec settings
##################################################################
SYSOM_CEC_URL = "redis://localhost:6379?cec_default_max_len=1000&cec_auto_mk_topic=true"
# 通道模块用于对外开放，投递操作的主题
SYSOM_CEC_CHANNEL_TOPIC = "SYSOM_CEC_CHANNEL_TOPIC"
# 通道模块消费组
SYSOM_CEC_CHANNEL_CONSUMER_GROUP = "SYSOM_CEC_CHANNEL_CONSUMER_GROUP"
# 通道模块用于投递执行结果的主题
SYSOM_CEC_CHANNEL_RESULT_TOPIC = "SYSOM_CEC_CHANNEL_RESULT_TOPIC"


##################################################################
# Channel 对外配置
##################################################################
CHANNEL_PUBLIC_PROTO = "http"
CHANNEL_PUBLIC_HOST = "127.0.0.1"
CHANNEL_PUBLIC_PORT = "7003"
CHANNEL_PUBLIC_BASE_URL = f"{CHANNEL_PUBLIC_PROTO}://{CHANNEL_PUBLIC_HOST}:{CHANNEL_PUBLIC_PORT}"

# 迁移模块CEC配置
SYSOM_MIGRATION_LISTEN_TOPIC = "SYSOM_MIGRATION_LISTEN_TOPIC"
SYSOM_MIGRATION_CONSUME_GROUP = "SYSOM_MIGRATION_CONSUME_GROUP"
SYSOM_MIGRATION_CEC_URL = f"{SYSOM_CEC_URL}&channel_job_target_topic={SYSOM_CEC_CHANNEL_TOPIC}&channel_job_listen_topic={SYSOM_MIGRATION_LISTEN_TOPIC}&channel_job_consumer_group={SYSOM_MIGRATION_CONSUME_GROUP}"

# 主机模块CEC配置
SYSOM_HOST_LISTEN_TOPIC = "SYSOM_HOST_LISTEN_TOPIC"
SYSOM_HOST_CONSUME_GROUP = "SYSOM_HOST_CONSUME_GROUP"
SYSOM_HOST_CEC_URL = f"{SYSOM_CEC_URL}&channel_job_target_topic={SYSOM_CEC_CHANNEL_TOPIC}&channel_job_listen_topic={SYSOM_HOST_LISTEN_TOPIC}&channel_job_consumer_group={SYSOM_HOST_CONSUME_GROUP}"


##################################################################
# Logging config
##################################################################
from cec_base.log import LoggerHelper, LoggerLevel
log_format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{file.path}</cyan>:<cyan>{line}</cyan> | {message}"
LoggerHelper.add(sys.stdout, level=LoggerLevel.LOGGER_LEVEL_INFO, format=log_format, colorize=True)
LoggerHelper.add(sys.stderr, level=LoggerLevel.LOGGER_LEVEL_WARNING, format=log_format, colorize=True)
