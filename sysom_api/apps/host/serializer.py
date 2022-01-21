import logging
from django.utils.translation import ugettext as _
from rest_framework import serializers
from apps.host.models import HostModel, Cluster

logger = logging.getLogger(__name__)


class HostListSerializer(serializers.ModelSerializer):
    cluster_id = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = HostModel
        fields = [
            'id', 'cluster', 'created_at', 'hostname', 'ip', 'port', 'username', 'description',
            'cluster_id', 'client_deploy_cmd', 'status'
        ]

    def get_cluster(self, attr: HostModel) -> dict:
        ser = ClusterListSerializer(instance=attr.cluster, many=False)
        return ser.data

    def get_cluster_id(self, attr: HostModel) -> int:
        return attr.cluster.id

    def get_description(self, attr: HostModel) -> str:
        return attr.description or '暂未填写'


class AddHostSerializer(serializers.ModelSerializer):
    hostname = serializers.CharField(error_messages={'required': '该字段必填'})
    ip = serializers.CharField(error_messages={'required': '该字段必填'})
    port = serializers.IntegerField(error_messages={'required': '该字段必填'})
    username = serializers.CharField(error_messages={'required': '该字段必填'})

    class Meta:
        model = HostModel
        fields = ('hostname', 'cluster', 'ip', 'port', 'username', 'private_key', 'description', 'client_deploy_cmd')

    def validate_hostname(self, attr):
        try:
            HostModel.objects.get(hostname=attr)
        except HostModel.DoesNotExist:
            return attr
        msg = _('主机名冲突!，请重新输入!\t')
        raise serializers.ValidationError(msg)

    def validate_ip(self, attr):
        try:
            HostModel.objects.get(ip=attr)
        except Cluster.DoesNotExist:
            return attr
        msg = _('IP地址冲突!，请重新输入!')
        raise serializers.ValidationError(msg)


class ClusterListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cluster
        exclude = ('deleted_at',)


class AddClusterSerializer(serializers.ModelSerializer):
    cluster_name = serializers.CharField(error_messages={'required': "该字段必填"})

    class Meta:
        model = Cluster
        exclude = ('deleted_at',)

    def validate_cluster_name(self, attr):
        try:
            Cluster.objects.get(cluster_name=attr)
        except Cluster.DoesNotExist:
            return attr
        msg = _('集群名冲突!，请重新输入!')
        raise serializers.ValidationError(msg)
