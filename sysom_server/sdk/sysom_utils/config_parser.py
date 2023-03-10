# -*- coding: utf-8 -*- #
"""
Time                2023/03/10 10:01
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                config_parser.py
Description:
"""
import yaml
from typing import Optional
from enum import Enum
from .yaml_concat import YamlConcatConstructor
from .adddict import Dict


def dict_merge(dct: dict, merge_dct: dict):
    """ Recursive dict merge. Inspired by :meth:``dict.update()``, instead of
    updating only top-level keys, dict_merge recurses down into dicts nested
    to an arbitrary depth, updating keys. The ``merge_dct`` is merged into
    ``dct``.

    Args:
        dct(Dict): dict onto which the merge is executed
        merge_dct(Dict): dct merged into dct
    Return:
        None
    """
    for k, v in merge_dct.items():
        if (k in dct and isinstance(dct[k], dict) and isinstance(merge_dct[k], dict)):  # noqa
            dict_merge(dct[k], merge_dct[k])
        else:
            dct[k] = merge_dct[k]


SYSOM_CONFIG_SECTION_GLOBAL = "sysom_global"
SYSOM_CONFIG_SECTION_SERVER = "sysom_server"
SYSOM_CONFIG_SECTION_WEB = "sysom_web"
SYSOM_CONFIG_SECTION_NODE = "sysom_node"
SYSOM_CONFIG_SECTION_SERVICE = "sysom_service"


class ConfigParserException(Exception):
    pass


class CecTarget(Enum):
    ADMIN = "admin"
    CONSUMER = "consumer"
    PRODUCER = "producer"


class ConfigParser:
    def __init__(self, global_config_path: str, service_config_path: str) -> None:
        self.global_config_path = global_config_path
        self.service_config_path = service_config_path
        self._config: Dict = self._load_config()

    def _load_config(self) -> Dict:
        YamlConcatConstructor.add_to_loader_class(loader_class=yaml.FullLoader)
        global_config: dict = {}
        service_config: dict = {}
        result_config: dict = {}
        # Load config
        with open(self.global_config_path, "r") as f:
            global_config = yaml.full_load(f.read())
        with open(self.service_config_path, "r") as f:
            service_config = yaml.full_load(f.read())
        dict_merge(result_config, global_config)
        dict_merge(result_config, service_config)
        return Dict(result_config)

    def get_config(self) -> Dict:
        return self._config

    def get_global_config(self) -> Dict:
        return Dict(self._config.get(SYSOM_CONFIG_SECTION_GLOBAL, {}))

    def get_server_config(self) -> Dict:
        return Dict(self._config.get(SYSOM_CONFIG_SECTION_SERVER, {}))

    def get_node_config(self) -> Dict:
        return Dict(self._config.get(SYSOM_CONFIG_SECTION_NODE, {}))

    def get_service_config(self) -> Dict:
        return Dict(self._config.get(SYSOM_CONFIG_SECTION_SERVICE, {}))

    ##############################################################################
    # Helper functions
    ##############################################################################

    def get_consumer_group(self) -> str:
        return self.get_server_config().cec.consumer_group

    def get_cec_url(self, target: CecTarget) -> str:
        server_config = self.get_server_config()
        cec_config = server_config.cec
        special_param = {}
        params = []
        dict_merge(special_param, cec_config.special_param.comm)
        dict_merge(special_param, cec_config.special_param.get(target.value, {}))
        cec_url = ""
        if cec_config.protocol == "redis":
            redis_config = server_config.db.redis
            cec_url = (
                f"{cec_config.protocol}://{redis_config.host}:{redis_config.port}?"
            )
            if redis_config.username:
                params.append(f"username={redis_config.username}")
            if redis_config.password:
                params.append(f"password={redis_config.password}")
        else:
            raise ConfigParserException(
                f"Not support cec protocol: {cec_config.protocol}")
        for k in params:
            params.append(f"{k}={params[k]}")
        cec_url += "&".join(params)
        return cec_url

    def get_local_channel_job_url(self) -> str:
        server_config = self.get_server_config()
        channel_job_config = server_config.channel_job
        cec_url = self.get_cec_url(CecTarget.PRODUCER)
        params = [
            f"channel_job_target_topic={channel_job_config.target_topic}",
            f"channel_job_listen_topic={channel_job_config.listen_topic}",
            f"channel_job_consumer_group={channel_job_config.consumer_group}"
        ]
        return cec_url + "&".join(params)
