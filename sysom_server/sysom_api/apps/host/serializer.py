import json
from django.utils.translation import ugettext as _
from rest_framework import serializers
from apps.host.models import HostModel, Cluster
from apps.accounts.models import User


class HostSerializer(serializers.ModelSerializer):
    """
    主机信息序列化器
    """
    host_info = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()

    class Meta:
        model = HostModel
        fields = [
            'id', 'cluster', 'created_at', 'hostname', 'ip', 'port', 'username', 'description', 'client_deploy_cmd', 'status', 'private_key', 'host_info', 'created'
        ]
        extra_kwargs = {
            'private_key': {
                'write_only': True
            },
        }
    
    def get_host_info(self, obj: HostModel):
        attr = obj.host_info or {}
        return json.loads(attr) if isinstance(attr, str) else attr

    def get_created(self, obj):
        """
        获取创建者, 如果created_by字段为空或user不存在
        则返回admin用户
        """
        try:
            user = User.objects.get(pk=obj.created_by)
        except User.DoesNotExist:
            user = User.objects.get(username='admin')
        
        return user.username


class ClusterSerializer(serializers.ModelSerializer):
    hosts = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Cluster
        exclude = ('deleted_at',)
