# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                crud.py
Description:
"""
from sqlalchemy.orm import Session
from app import models, schemas

################################################################################################
# ChannelSetting
################################################################################################


def get_setting_by_name(db: Session, name: str) -> models.ChannelSetting:
    """Get ChannelSetting by name
    """
    return db.query(models.ChannelSetting).filter(models.ChannelSetting.name == name).first()


def create_setting(db: Session, channel_setting: schemas.ChannelSetting) -> models.ChannelSetting:
    """Create ChannelSetting
    """
    channl_setting_item = models.ChannelSetting(
        name=channel_setting.name,
        value=channel_setting.value,
        description=channel_setting.description
    )
    db.add(channl_setting_item)
    db.commit()
    db.refresh(channl_setting_item)
    return channl_setting_item


def update_or_create_channel_setting(
    db: Session, channel_setting: schemas.ChannelSetting
) -> models.ChannelSetting:
    """Update or create ChannelSetting
    """
    channel_setting_item = get_setting_by_name(db, channel_setting.name)
    if channel_setting_item is None:
        channel_setting_item = create_setting(db, channel_setting)
    else:
        channel_setting_item.value = channel_setting.value
        db.commit()


################################################################################################
# ChannelParams
################################################################################################

def get_channel_params_by_instance(db: Session, instance: str) -> models.ChannelParams:
    """Get ChannelParams by instance
    """
    return db.query(models.ChannelParams).filter(models.ChannelParams.instance == instance).first()


def create_channel_params(db: Session, channel_params: schemas.ChannelParams) -> models.ChannelParams:
    """Create ChannelParams
    """
    channel_params_item = models.ChannelParams(
        instance=channel_params.instance,
        params=channel_params.params
    )
    db.add(channel_params_item)
    db.commit()
    db.refresh(channel_params_item)
    return channel_params_item


def update_or_create_channel_params(
    db: Session, channel_params: schemas.ChannelParams
) -> models.ChannelParams:
    """Update or create ChannelParams
    """
    channel_params_item = get_channel_params_by_instance(
        db, channel_params.instance)
    if channel_params_item is None:
        channel_params_item = create_channel_params(db, channel_params)
    else:
        channel_params_item.params = channel_params.params
        db.commit()
