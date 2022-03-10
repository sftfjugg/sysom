"""sysom URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, re_path
from django.urls.conf import include
from django.conf import settings


urlpatterns = [
    path('', include("apps.host.urls")),
    path('', include("apps.accounts.urls")),
    path('', include("apps.monitor.urls")),
    path('', include("apps.task.urls")),
    path('', include("apps.vmcore.urls")),
    path('', include("apps.alarm.urls")),
    path('', include("apps.vul.urls")),
]

if settings.DEBUG:
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
