# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                config.py
Description:
"""
from fastapi import APIRouter
from app.crud import get_setting_by_name
from app.database import SessionLocal


router = APIRouter()


@router.get("/get")
async def get_channel_config(name: str):
    with SessionLocal() as db:
        return {
            "code": 0,
            "err_msg": "",
            "data": get_setting_by_name(db, name).value
        }
