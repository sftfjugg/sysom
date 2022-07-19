import logging
from django.utils.translation import ugettext as _
from rest_framework import serializers
from apps.host.models import HostModel, Cluster

logger = logging.getLogger(__name__)


class HostSerializer(serializers.ModelSerializer):

    class Meta:
        model = HostModel
        fields = [
            'id', 'cluster', 'created_at', 'hostname', 'ip', 'port', 'username', 'description', 'client_deploy_cmd', 'status', 'private_key'
        ]
        extra_kwargs = {
            'private_key': {
                'write_only': True
            },
        }


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
