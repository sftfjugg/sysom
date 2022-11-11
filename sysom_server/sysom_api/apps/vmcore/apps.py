import json
import os
from django.apps import AppConfig

from django.db.models.signals import post_migrate
from django.db import transaction
from django.conf import settings



class VmcoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.vmcore'

    def ready(self) -> None:
        post_migrate.connect(initialization_vmcore, sender=self)


def initialization_vmcore(sender, **kwargs):
    load_vmcore_init_data()


@transaction.atomic
def load_vmcore_init_data():
    json_file_path = os.path.join(settings.BASE_DIR, 'apps', 'vmcore')
    json_dir_list = [dir for dir in os.listdir(json_file_path) if 'json' in dir]
    if len(json_dir_list) > 0:
        for file_name in json_dir_list:
            with open(os.path.join(json_file_path, file_name), 'r', encoding='utf-8') as f:
                dataList = json.loads(f.read())
            [check_orm_project(data) for data in dataList]
    else:
        pass


def check_orm_project(data):
    try:
        from .models import Issue, Panic, Calltrace
        model = None
        model_name = data['model'].split('.')[-1]
        if model_name == "panic":
            model = Panic
        elif model_name == "issue":
            model = Issue
        elif model_name == "calltrace":
            model = Calltrace

        model.objects.get_or_create(pk=data['pk'], **data['fields'])
    except Exception as e:
        pass