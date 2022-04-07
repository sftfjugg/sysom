from rest_framework import serializers
from apps.vul.models import VulAddrModel


class VulAddrListSerializer(serializers.ModelSerializer):
    method_display = serializers.SerializerMethodField()

    class Meta:
        model = VulAddrModel
        fields = ["id", "name", "description", "method", "method_display", "url", "headers", "params", "body",
                  "authorization_type", "parser"
                  ]

    def get_method_display(self, attr: VulAddrModel) -> int:
        return attr.get_method_display()

    def get_description(self, attr: VulAddrModel) -> str:
        return attr.description or '暂未填写'


class VulAddrModifySerializer(serializers.ModelSerializer):
    authorization_body = serializers.JSONField(required=False)

    class Meta:
        model = VulAddrModel
        fields = ["name", "description", "method", "url", "headers", "params", "body", "authorization_type",
                  "authorization_body", "parser"
                  ]
