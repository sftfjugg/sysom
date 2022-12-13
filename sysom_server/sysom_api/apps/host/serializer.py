import json
from django.utils.translation import ugettext as _
from rest_framework import serializers
from apps.host.models import HostModel, Cluster


class HostSerializer(serializers.ModelSerializer):

    host_info = serializers.SerializerMethodField()

    class Meta:
        model = HostModel
        fields = [
            'id', 'cluster', 'created_at', 'hostname', 'ip', 'port', 'username', 'description', 'client_deploy_cmd', 'status', 'private_key', 'host_info'
        ]
        extra_kwargs = {
            'private_key': {
                'write_only': True
            },
        }
    
    def get_host_info(self, obj: HostModel):
        attr = obj.host_info or {}
        return json.loads(attr) if isinstance(attr, str) else attr


class ClusterSerializer(serializers.ModelSerializer):
    hosts = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Cluster
        exclude = ('deleted_at',)
