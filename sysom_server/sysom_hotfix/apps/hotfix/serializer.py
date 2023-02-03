import logging
from rest_framework import serializers
from apps.hotfix.models import HotfixModel, OSTypeModel, KernelVersionModel
logger = logging.getLogger(__name__)

from datetime import datetime

class HotfixSerializer(serializers.ModelSerializer):

    class Meta:
        model = HotfixModel
        fields = '__all__' # fields 指定从数据库返回的字段
    

class OSTypeSerializer(serializers.ModelSerializer):

    class Meta:
        model = OSTypeModel
        fields = '__all__'

class KernelSerializer(serializers.ModelSerializer):

    class Meta:
        model = KernelVersionModel
        fields = '__all__'
