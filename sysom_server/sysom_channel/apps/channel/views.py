import logging
from django.http.response import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from rest_framework.filters import SearchFilter, OrderingFilter
from lib.base_view import CommonModelViewSet

logger = logging.getLogger(__name__)


class ChannelView(CommonModelViewSet):
    pass