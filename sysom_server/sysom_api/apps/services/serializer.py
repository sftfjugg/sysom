import logging
from django.utils.translation import ugettext as _
from rest_framework import serializers
from apps.services.models import ServiceInfo

logger = logging.getLogger(__name__)


class ServiceInfoSerializer(serializers.ModelSerializer):

    class Meta:
        model = ServiceInfo
        fields = [
            'id', 'service_name', 'created_at'
        ]