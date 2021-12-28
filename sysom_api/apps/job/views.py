from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins

from apps.accounts.authentication import Authentication
from apps.job import models, seriaizer
from lib import success


class JobAPIView(GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    queryset = models.JobModel.objects.all()
    serializer_class = seriaizer.JobListSerializer
    authentication_classes = [Authentication]

    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.filter(created_by=self.request.user)
        queryset = queryset.filter(deleted_at=None)
        return queryset

    def get_object(self):
        pass

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        return success(result=response.data)
