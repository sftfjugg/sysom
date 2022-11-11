# -*- coding: utf-8 -*- #
"""
Time                2022/11/7 11:47
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                entry.py
Description:
"""
from typing import Optional
import json
import uuid


class JobEntry:
    def __init__(self, channel_type: str = "ssh", channel_opt: str = "cmd",
                 params: dict = {}, echo: dict = {},
                 listen_topic: str = "", job_id: Optional[str] = None) -> None:
        self.channel_type = channel_type
        self.channel_opt = channel_opt
        self.params = params
        self.job_id = job_id
        self.echo = echo
        self.listen_topic = listen_topic
        if self.job_id is None:
            self.job_id = str(uuid.uuid4())

    def to_channel_vlaue(self) -> dict:
        result = {
            "channel": self.channel_type,
            "type": self.channel_opt,
            "params": self.params,
            "echo": {
                **self.echo,
                "__job_id": self.job_id,
            }
        }
        if self.listen_topic:
            result["bind_result_topic"] = self.listen_topic
        return result


class JobResult:
    def __init__(self, code: int, err_msg: str = "", result: str = "",
                 echo: dict = {}) -> None:
        self.code = code
        self.err_msg = err_msg
        self.result = result
        self.echo = echo
        self.job_id = self.echo.pop("__job_id", "")
        self.is_finished = self.code != 100

    @staticmethod
    def parse_by_cec_event_value(value: dict):
        result = value.get("result", "")
        if isinstance(result, dict):
            result = json.dumps(result)
        return JobResult(
            code=value.get("code", 1),
            err_msg=value.get("err_msg", ""),
            result=result,
            echo=value.get("echo", {})
        )

    @staticmethod
    def parse_by_other_job_result(job_result):
        return JobResult(
            code=job_result.code,
            err_msg=job_result.err_msg,
            result=job_result.result,
            echo=job_result.echo
        )
