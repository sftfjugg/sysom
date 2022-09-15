import logging
from django.apps import AppConfig
from django.db.models.signals import post_migrate
logger = logging.getLogger(__name__)

class VulConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.vul'

    def ready(self) -> None:
        post_migrate.connect(initialization_vul_config, sender=self)
        logger.info(">>> Vul module loading success")


def initialization_vul_config(sender, **kwargs):
    try:
        from .models import VulAddrModel
        VulAddrModel.objects.create(
            name="Anolis 漏洞数据",
            description = "Anolis 漏洞数据",
            url = "https://anas.openanolis.cn/api/portal/v1/cves/?page_num=1&page_size=50",
            parser = {"cve_item_path":"data/data","cve_id_flag":"cve_id","score_flag":"score","pub_time_flag":"publish_date"}
        )
    except Exception as e:
        pass