from django.urls import path
from django.urls.conf import include
from django.conf import settings

app_urlpatterns = [path('', include(f'{app}.urls')) for app in settings.INSTALLED_APPS if app.startswith('apps')]

urlpatterns = []
urlpatterns += app_urlpatterns

if settings.DEBUG and not settings.IS_MICRO_SERVICES:
    from drf_yasg.views import get_schema_view
    from drf_yasg import openapi

    from apps.accounts.authentication import Authentication

    schema_view = get_schema_view(
        openapi.Info(
            title="SysOM后端API文档",
            default_version='v1',
            description="暂无..."
        ),
        public=True,
        # permission_classes=(permissions.AllowAny,),
        authentication_classes=(Authentication, )
    )

    urlpatterns += [
        path('doc/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ]
