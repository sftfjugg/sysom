# -*- coding: utf-8 -*- #
"""
Time                2022/10/21 10:08
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                admin_static.py
Description:
"""
from typing import Any
from rest_framework.viewsets import GenericViewSet
from rest_framework.exceptions import ValidationError
from cec_base.cec_client import CecClient
from django.conf import settings


class CommonModelViewSet(GenericViewSet):
    """
    通用 ModelViewSet 实现，提供一些通用工具方法
    """

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self._inner_cec_client: CecClient = None

    def produce_event_to_cec(self, topic: str, value: dict):
        """Produce one event to specific topic"""
        if self._inner_cec_client is None:
            self._inner_cec_client = CecClient(settings.SYSOM_CEC_URL)
        self._inner_cec_client.delivery(topic, value)

    def require_param_validate(self, request, require_params):
        """
        检查请求参数中是否包含所需的所有参数，任何参数缺失将返回错误，错误信息中包含缺失的参数列表
        @param request => HTTP 请求
        @param require_params => 需要验证的参数列表，例如：['hostname', 'ip']
        """
        if request.method in ['POST', 'PATCH', 'DELETE']:
            context, missing_param_list = request.data, []
            for require_param in require_params:
                if require_param not in context:
                    missing_param_list.append(require_param)
            if len(missing_param_list) > 0:
                return {
                    "success": False,
                    "message": f"Missing parameters: {', '.join(missing_param_list)}"
                }
        return {
            "success": True,
            "message": ""
        }

    def extract_specific_params(self, request, params_list, require_all: bool = False):
        """
        从请求参数中提取 params_list 中指定的参数列表 => 最后将不在参数列表中的所有其它参数从参数列表中移除
        @param request => HTTP 请求
        @param params_list => 需要提取的参数列表，例如：['cluster']
        @param require_all => 是否所有参数都是必须的
                                True => 任何参数缺失都会返回错误
                                False => 对于每一个参数，有则提取，无则忽略 
        """
        if require_all:
            res = self.require_param_validate(request, params_list)
            if not res["success"]:
                return res
        if request.method in ['POST', 'PATCH', 'DELETE']:
            context, not_allow_params = request.data, []
            for key in context:
                if key not in params_list:
                    not_allow_params.append(key)
            for param_name in not_allow_params:
                context.pop(param_name)

        return {
            "success": True,
            "message": "",
        }

    def get_format_err_msg_for_validation_error(self, data: dict, err: ValidationError) -> str:
        """
        对验证错误的错误信息进行转换，使得提示更易读懂
        """
        results = []
        for k, v in err.detail.items():
            if v[0].code == 'unique':
                # 唯一性错误
                results.append(f"{k}（{data[k]}）已存在")
            else:
                # 其它错误
                results.append(v[0])
        return "; ".join(results)
