import logging
from rest_framework import serializers
from apps.hotfix.models import HotfixModel
logger = logging.getLogger(__name__)

from datetime import datetime

class HotfixSerializer(serializers.ModelSerializer):
    patch_name = serializers.SerializerMethodField()

    class Meta:
        model = HotfixModel
        fields = ('id','created_at','deleted_at','arch','kernel_version','patch_path',
        'building_status','hotfix_necessary','hotfix_risk','creator','patch_name', 'formal',) # fields 指定从数据库返回的字段
    
    def get_patch_name(self, attr: HotfixModel):
        return attr.patch_path.split("/")[-1]
