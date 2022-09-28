import logging
from rest_framework import serializers

from . import models

logger = logging.getLogger(__name__)


class PanicListSerializer(serializers.ModelSerializer):
    vmcore_link = serializers.SerializerMethodField()
    vmcore_check = serializers.SerializerMethodField()
    issue_check = serializers.SerializerMethodField()

    class Meta:
        model = models.Panic
        fields = ('id','name','hostname','ip','core_time','ver','vmcore_check','issue_id','vmcore_link','issue_check')
        #fields = "__all__"

    def get_vmcore_link(self, attr: models.Panic) -> str:
        return 'http://127.0.0.1:8000/api/v1/vmcore_detail/?vmcore_name='+attr.name

    def get_vmcore_check(self, attr: models.Panic) -> bool:
        if attr.vmcore_file != '' and attr.vmcore_file != 'null':
            return True
        else:
            return False

    def get_issue_check(self, attr: models.Panic) -> bool:
        if attr.issue_id != 0 and attr.issue_id != None:
            return True
        else:
            return False


class PanicDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Panic
        fields = "__all__"


class AddPanicSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Panic
        fields = "__all__"


class IssueSerializer(serializers.ModelSerializer):
    #permissions = serializers.SerializerMethodField()

    class Meta:
        model = models.Issue
        fields = "__all__"


class AddIssueSerializer(serializers.ModelSerializer):
    #permissions = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = models.Issue
        fields = "__all__"


class ConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.VmcoreConfig
        fields = "__all__"


