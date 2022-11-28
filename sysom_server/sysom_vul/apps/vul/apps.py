import logging
import sys
from django.apps import AppConfig
from django.db.models.signals import post_migrate
logger = logging.getLogger(__name__)


class VulConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.vul'

    def ready(self) -> None:
        post_migrate.connect(initialization_vul_config, sender=self)
        from django.conf import settings
        if ('runserver' in sys.argv or 'manage.py' not in sys.argv):
            from cec_base.log import LoggerHelper, LoggerLevel
            from channel_job.job import default_channel_job_executor
            LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_INFO)
            # 初始化 channel_job sdk
            default_channel_job_executor.init_config(settings.CHANNEL_JOB_URL)
            default_channel_job_executor.start()
        else:
            # from cec_base.log import LoggerHelper, LoggerLevel
            # from channel_job.job import default_channel_job_executor
            # LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_INFO)
            # # 初始化 channel_job sdk
            # default_channel_job_executor.init_config(settings.CHANNEL_JOB_URL)
            # default_channel_job_executor.start()
            
            # job_result = default_channel_job_executor.dispatch_job(
            #     channel_type="ssh",
            #     channel_opt='cmd',
            #     params={
            #         'instance': "127.0.0.1",
            #         "command": "pwd",
            #     },
            #     timeout=5000,
            #     auto_retry=True
            # ).execute()
            # print(job_result.code)
            # print(job_result.result)
            # 这边执行数据库迁移等操作的时候执行一些处理代码
            pass
        logger.info(">>> Vul module loading success")


def initialization_vul_config(sender, **kwargs):
    try:
        from .models import VulAddrModel
        VulAddrModel.objects.create(
            name="Anolis 漏洞数据",
            description="Anolis 漏洞数据",
            url="https://anas.openanolis.cn/api/portal/v1/cves/?page_num=1&page_size=50",
            parser={"cve_item_path": "data/data", "cve_id_flag": "cve_id",
                    "score_flag": "score", "pub_time_flag": "publish_date"}
        )
    except Exception as e:
        pass
