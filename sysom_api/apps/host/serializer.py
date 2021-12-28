import logging
from rest_framework import serializers
from apps.host.models import HostModel, HostType

logger = logging.getLogger(__name__)


class HostListSerializer(serializers.ModelSerializer):
    host_type_id = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = HostModel
        fields = [
            'id', 'h_type', 'created_at', 'hostname', 'ip', 'port', 'username', 'description',
            'host_type_id', 'client_deploy_cmd', 'status'
        ]

    def get_host_type(self, attr: HostModel) -> dict:
        ser = HostTypeListSerializer(instance=attr.h_type, many=False)
        return ser.data

    def get_host_type_id(self, attr: HostModel) -> int:
        return attr.h_type.id

    def get_description(self, attr: HostModel) -> str:
        return attr.description or '暂未填写'


class AddHostSerializer(serializers.ModelSerializer):
    hostname = serializers.CharField(error_messages={'required': '该字段必填'})
    ip = serializers.CharField(error_messages={'required': '该字段必填'})
    port = serializers.IntegerField(error_messages={'required': '该字段必填'})
    username = serializers.CharField(error_messages={'required': '该字段必填'})

    class Meta:
        model = HostModel
        fields = ('hostname', 'h_type', 'ip', 'port', 'username', 'private_key', 'description', 'client_deploy_cmd')


class HostTypeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostType
        exclude = ('deleted_at',)


class AddHostTypeSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(error_messages={'required': "该字段必填"})

    class Meta:
        model = HostType
        exclude = ('deleted_at',)

    def validate_type_name(self, attr):
        try:
            HostType.objects.get(type_name=attr)
        except HostType.DoesNotExist:
            return attr
        raise serializers.ValidationError("该服务已存在!")
