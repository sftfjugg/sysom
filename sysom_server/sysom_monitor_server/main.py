from channel_job import default_channel_job_executor
from fastapi import FastAPI
from conf.settings import *
from app.routeres import home
from sysom_utils import PluginEventExecutor

app = FastAPI()

app.include_router(home.router, prefix="/api/v1/monitor/home")


def init_monitor():
    # 从 Channel 为服务拉取配置初始化 channel_job
    default_channel_job_executor.init_config(CHANNEL_JOB_URL)
    default_channel_job_executor.start()

    PluginEventExecutor(YAML_CONFIG, default_channel_job_executor).start()


@app.on_event("startup")
async def on_start():
    init_monitor()
    pass


@app.on_event("shutdown")
async def on_shutdown():
    pass
