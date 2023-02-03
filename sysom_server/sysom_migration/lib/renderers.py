import logging
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.core.handlers.asgi import ASGIRequest
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request


logger = logging.getLogger(__name__)
# User = get_user_model()


class SysomJsonRender(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context:
            request = renderer_context.get('request', None)
            view = renderer_context.get('view', None)
            response = renderer_context.get('response', None)
            self.before_response_save_log(request, view, response)
        return super().render(data, accepted_media_type, renderer_context)

    def before_response_save_log(self, request: Request, view, response):
        # user = getattr(request, 'user') or get_object_or_404(User, pk=1)
        request: ASGIRequest = getattr(request, '_request', None)
        method = request.method

        result = response.data
        kwargs = {
            'request_ip': request.META.get('REMOTE_ADDR', None),
            'request_url': request.path,
            'request_browser_agent': request.headers.get('User-Agent', ''),
            'request_method': method,
            'handler_view': view.__class__.__name__,
            'response_status': getattr(response, 'status_code', 200),
        }
        if 'auth' in request.path:
            kwargs['request_option'] = 0
            if result.get('code') == 200:
                kwargs['user_id'] = result['data']['id']
        else:
            kwargs['request_option'] = 1
            # kwargs['user'] = user
