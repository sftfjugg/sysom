# -*- encoding: utf-8 -*-
"""
@File    : serializer.py
@Time    : 2022/4/8 下午1:49
@Author  : weidongkl
@Email   : weidong@uniontech.com
@Software: PyCharm
"""
import json
from collections import OrderedDict
from rest_framework import serializers
from rest_framework.exceptions import ParseError
from loguru import logger
from apps.vul.models import VulAddrModel


class VulAddrListSerializer(serializers.ModelSerializer):
    method_display = serializers.SerializerMethodField()
    headers = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    parser = serializers.SerializerMethodField()
    authorization_type = serializers.SerializerMethodField()
    params = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()

    class Meta:
        model = VulAddrModel
        fields = ["id", "name", "description", "method", "method_display", "url", "headers", "params", "body",
                  "authorization_type", "authorization_body","parser", "status", "is_edited"
                  ]
    
    def _attr_str_to_dict(self, instance, attr_name):
        """
        将str转成dict
        """
        attr = getattr(instance, attr_name, None)
        if attr is None:
            raise ParseError(code=400, detail=f'Not {attr_name} attr!')
        
        if len(attr) == 0:
            return {}

        try:
            return json.loads(attr)
        except json.decoder.JSONDecodeError as e:
            raise ParseError(code=400, detail=f'{attr_name}字段解析失败! {e}')

    def get_method_display(self, attr: VulAddrModel) -> int:
        return attr.get_method_display()

    def get_description(self, attr: VulAddrModel) -> str:
        return attr.description or '暂未填写'

    def get_headers(self, attr: VulAddrModel) -> str:
        if attr.is_edited:
            return self._attr_str_to_dict(attr, 'headers')
        else:
            shadow_string = "x" * 12
            shadow_fields = ["token", "authorization"]
            display_headers = attr.headers.copy()
            for k, v in attr.headers.items():
                if k.lower() in shadow_fields:
                    display_headers[k] = shadow_string
            return display_headers

    def get_parser(self, attr):
        return self._attr_str_to_dict(attr, 'parser')
        
    def get_authorization_type(self, attr):
        return self._attr_str_to_dict(attr, 'authorization_type')

    def get_params(self, attr):
        return self._attr_str_to_dict(attr, 'params')

    def get_body(self, attr):
        return self._attr_str_to_dict(attr, 'body')


class VulAddrModifySerializer(serializers.ModelSerializer):
    authorization_body = serializers.JSONField(required=False)
    headers = serializers.JSONField(required=False)
    params = serializers.JSONField(required=False)
    body = serializers.JSONField(required=False)
    authorization_body = serializers.JSONField(required=False)
    parser = serializers.JSONField(required=False)

    class Meta:
        model = VulAddrModel
        fields = ["name", "description", "method", "url", "headers", "params", "body", "authorization_type",
                  "authorization_body", "parser"
                  ]
        to_dict_fields = ['headers', 'params', 'body', 'authorization_body', 'parser']
    
    def update(self, instance, validated_data):
        for k, v in validated_data.items()        :
            if k in self.Meta.to_dict_fields: validated_data[k] = json.dumps(v)
        return super().update(instance, validated_data)

