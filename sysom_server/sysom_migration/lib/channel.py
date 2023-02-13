import logging
from channel_job.job import default_channel_job_executor

logger = logging.getLogger(__name__)


def sync_job(ip, cmd, echo=dict(), timeout=30000, auto_retry=False):
    data = dict(
        channel_type="ssh", 
        channel_opt="cmd", 
        params={
            "instance": ip,
            "command": cmd,
        },
        echo=echo,
        timeout=timeout,
        auto_retry=auto_retry
    )
    job = default_channel_job_executor.dispatch_job(**data)
    result = job.execute()
    logger.info(result.__dict__)
    return result, data


def async_job(ip, cmd, echo=dict(), timeout=30000, auto_retry=False, chunk=None, finish=None):
    data = dict(
        channel_type="ssh", 
        channel_opt="cmd", 
        params={
            "instance": ip,
            "command": cmd,
        },
        echo=echo,
        timeout=timeout,
        auto_retry=auto_retry
    )
    job = default_channel_job_executor.dispatch_job(**data)
    job.execute_async_with_callback(finish, chunk)
    return data


def send_file(ips, lpath, rpath):
    job = default_channel_job_executor.dispatch_file_job(
        params={
            "local_path": lpath,
            "remote_path": rpath,
            "instances": ips
        },
        opt="send-file"
    )
    result = job.execute()
    logger.info(f'send file {lpath} to {rpath}')
    logger.info(result.__dict__)
    return result


def get_file(ip, lpath, rpath):
    job = default_channel_job_executor.dispatch_file_job(
        params={
            "local_path": lpath,
            "remote_path": rpath,
            "instance": ip
        },
        opt="get-file"
    )
    result = job.execute()
    logger.info(f'host {ip} get file {rpath} to {lpath}')
    logger.info(result.__dict__)
    return result
