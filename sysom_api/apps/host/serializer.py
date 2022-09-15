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


class ClusterSerializer(serializers.ModelSerializer):
    hosts = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Cluster
        exclude = ('deleted_at',)
