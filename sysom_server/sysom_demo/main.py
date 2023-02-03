from fastapi import FastAPI
from channel_job import default_channel_job_executor

SYSOM_CEC_URL = "redis://localhost:6379?cec_default_max_len=1000&cec_auto_mk_topic=true"
CHANNEL_JOB_URL = f"{SYSOM_CEC_URL}&channel_job_target_topic=SYSOM_CEC_CHANNEL_TOPIC" \
                  f"&channel_job_listen_topic=SYSOM_CEC_DEMO_TOPIC" \
                  f"&channel_job_consumer_group=SYSOM_CEC_DEMO_CONSUMER_GROUP"

default_channel_job_executor.init_config(CHANNEL_JOB_URL)
default_channel_job_executor.start()

app = FastAPI()

@app.get("/api/v1/demo/get_kernel_info/{instance}")
async def get_kernel_info(instance: str):
    job = default_channel_job_executor.dispatch_job(
        channel_type="ssh",
        channel_opt="cmd",
        params={
            "instance": instance,
            "command": "uname -a"
        }
    )
    channel_result = await job.execute_async()
    return {
        "code": channel_result.code,
        "err_msg": channel_result.err_msg,
        "result": channel_result.result
    }