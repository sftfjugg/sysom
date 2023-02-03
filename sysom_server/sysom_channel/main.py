# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                ssh.py
Description:
"""
import json
import logging
from typing import Optional
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import SessionLocal
from app.crud import create_setting, get_setting_by_name, update_or_create_channel_setting
from app.schemas import ChannelSetting
from lib.ssh import AsyncSSH
from conf.settings import *
from app.routers import file, config, cec_status


app = FastAPI()

app.mount("/public", StaticFiles(directory=STATIC_RESOURCE_PATH), name="public")
app.include_router(file.router, prefix="/api/v1/channel/file")
app.include_router(config.router, prefix="/api/v1/channel/config")
app.include_router(cec_status.router, prefix="/api/v1/channel/cec_status")

logger = logging.getLogger(__name__)


def init_channel():
    def get_setting(db, name: str) -> Optional[ChannelSetting]:
        try:
            return ChannelSetting.from_orm(
                get_setting_by_name(db, name))
        except Exception as e:
            pass
        return None

    def get_or_set_channel_setting(
        db, name: str, default_value: str, description: str = ""
    ) -> Optional[ChannelSetting]:
        # 1. Get if exists
        setting = get_setting(db, name)

        # 2. Create if not exists
        if setting is None:
            try:
                setting = ChannelSetting.from_orm(create_setting(db, ChannelSetting(
                    name=name, value=default_value, description=description
                )))
            except Exception as e:
                logger.warn(e)

        # 3. Prevent concurrent creation resulting in unsuccessful creation,
        # try to fetch again, this logic should barely be executed
        if setting is None:
            setting = get_setting(db, name)
        return setting
    
    def update_or_create(
        db, name: str, default_value: str, description: str = ""
    ):
        # update or create
        setting: Optional[ChannelSetting] = None
        try:
            setting = update_or_create_channel_setting(db, ChannelSetting(
                name=name, value=default_value, description=description
            ))
        except Exception as e:
            logger.warn(e)
        return setting
            

    from lib.utils import generate_key

    k, v = generate_key()
    ssh_key = json.dumps({"private_key": k, "public_key": v})

    ssh_setting: Optional[ChannelSetting] = None

    with SessionLocal() as db:
        ssh_setting = get_or_set_channel_setting(
            db, "ssh_key", ssh_key, "SysOM Channel auto generated key")
        _ = get_or_set_channel_setting(
            db, "cec_url", SYSOM_CEC_URL, "SysOM CEC URL")
        _ = update_or_create(
            db, "migration_setting", json.dumps({
                "cec_url": SYSOM_MIGRATION_CEC_URL,
                "channel_base_url": CHANNEL_PUBLIC_BASE_URL
            }), "SysOM migration channel setting")
        _ = update_or_create(
            db, "host_setting", json.dumps({
                "cec_url": SYSOM_HOST_CEC_URL,
                "channel_file_base_url": CHANNEL_PUBLIC_BASE_URL
            }), "SysOM host channel setting"
        )

    # 4. If ssh_key fetching or generation fails, the application does not start properly
    if ssh_setting is None:
        raise Exception("ssh_key fetching or generation fails")

    # 5. Save ssh_key to current host
    ssh_keys = json.loads(ssh_setting.value)
    AsyncSSH.set_private_key_getter(lambda: ssh_keys["private_key"])
    AsyncSSH.set_public_key_getter(lambda: ssh_keys["public_key"])

    # 6. Start Channel executor
    from app.executor import ChannelListener
    try:
        ChannelListener().start()
    except Exception as e:
        logger.exception(e)


@app.on_event("startup")
async def on_start():
    init_channel()


@app.on_event("shutdown")
async def on_shutdown():
    pass
