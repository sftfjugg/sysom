from django.urls import path
from django.urls.conf import include
from django.conf import settings

app_urlpatterns = [path('', include(
    f'{app}.urls')) for app in settings.INSTALLED_APPS if app.startswith('apps')]

urlpatterns = [
]

urlpatterns += app_urlpatterns
