from channel_job.job import default_channel_job_executor


def sync_job(ip, cmd, echo=dict(), timeout=15000):
    data = dict(
        channel_type="ssh", 
        channel_opt="cmd", 
        params={
            "instance": ip,
            "command": cmd,
        },
        echo=echo,
        timeout=timeout,
        auto_retry=True
    )
    job = default_channel_job_executor.dispatch_job(**data)
    result = job.execute()
    return result, data


def async_job(ip, cmd, echo=dict(), timeout=15000, chunk=None, finish=None):
    data = dict(
        channel_type="ssh", 
        channel_opt="cmd", 
        params={
            "instance": ip,
            "command": cmd,
        },
        echo=echo,
        timeout=timeout,
        auto_retry=True
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
    return result
