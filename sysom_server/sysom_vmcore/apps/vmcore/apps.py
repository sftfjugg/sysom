import json
import os
import sys
from django.apps import AppConfig
from loguru import logger

from django.db.models.signals import post_migrate
from django.db import transaction



class VmcoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.vmcore'

    def ready(self) -> None:
        from django.conf import settings
        from sysom_utils import PluginEventExecutor
        if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
            from channel_job.job import default_channel_job_executor

            # 初始化 channel_job sdk
            default_channel_job_executor.init_config(settings.CHANNEL_JOB_URL)
            default_channel_job_executor.start()

            # 初始化插件处理线程（自动处理节点端的初始化和清理操作）
            PluginEventExecutor(
                settings.YAML_CONFIG, default_channel_job_executor
            ).start()
        else:
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Diagnosis module loading success")
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