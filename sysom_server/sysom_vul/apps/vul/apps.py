import sys
import json
from loguru import logger
from django.apps import AppConfig
from django.db.models.signals import post_migrate


class VulConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.vul'

    def ready(self) -> None:
        post_migrate.connect(initialization_vul_config, sender=self)
        from django.conf import settings
        if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
            from channel_job.job import default_channel_job_executor
            # 初始化 channel_job sdk
            default_channel_job_executor.init_config(settings.CHANNEL_JOB_URL)
            default_channel_job_executor.start()
        logger.info(">>> Vul module loading success")


def initialization_vul_config(sender, **kwargs):
    """
    初始化vul_db表数据
    """
    parser = {
        "cve_item_path": "data/data",
        "cve_id_flag": "cve_id",
        "score_flag": "score",
        "pub_time_flag": "publish_date"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\
             (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    }

    fields = {
        "name": "Anolis 漏洞数据",
        "description": "Anolis 漏洞数据",
        "url": "https://anas.openanolis.cn/api/portal/v1/cves/?format=json&page_num=1&page_size=50",
        "parser": json.dumps(parser),
        "headers": json.dumps(headers)
    }

    try:
        from .models import VulAddrModel
        VulAddrModel.objects.create(**fields)
    except Exception as e:
        pass
