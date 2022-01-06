'''
@File: paginations.py
@Time: 2021-12-14 13:46:02
@Author: DM
@Desc: Local Paginations Class
'''

from rest_framework.pagination import PageNumberPagination
from lib.response import success


class  Pagination(PageNumberPagination):
    page_query_param = "current"
    page_size_query_param = "pageSize"

    def paginate_queryset(self, queryset, request, view=None):
        self.max_page_size = queryset.count()
        return super().paginate_queryset(queryset, request, view=view)

    def get_paginated_response(self, data):
        return success(message="获取成功", result=data, total=self.page.paginator.count)

    def get_page_size(self, request):
        if not request.query_params.get(self.page_size_query_param, None):
            return self.max_page_size
        return super().get_page_size(request)