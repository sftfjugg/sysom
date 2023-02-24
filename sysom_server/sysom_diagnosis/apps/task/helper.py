import json
import os
import subprocess
from loguru import logger
import tempfile
import ast
from typing import Callable
from apps.task.models import JobModel
from django.conf import settings
from django.db import connection
from lib.utils import uuid_8
from channel_job.job import default_channel_job_executor, JobResult


class DiagnosisHelper:
    """A helper class used to perform diagnosis task"""

    @staticmethod
    def _update_job(instance: JobModel, **kwargs):
        """Update JobModel object"""
        try:
            if isinstance(kwargs.get("result", ""), dict):
                kwargs['result'] = json.dumps(kwargs.get('result', ""))
            instance.__dict__.update(**kwargs)
            instance.save()
        except Exception as e:
            raise e
        finally:
            connection.close()

    @staticmethod
    def init(data: dict, user: dict) -> JobModel:
        """Some params check, and create one new task with Ready status"""
        user_id = user["id"]
        params = data.copy()
        service_name = data.pop("service_name", None)
        task_id = uuid_8()

        for k, v in params.items():
            if isinstance(v, str):
                params[k] = v.strip()

        # 1. Determines if there is a task with the same parameters
        #    and a status of Running.
        if JobModel.objects.filter(
            status__in=["Ready", "Running"], service_name=service_name,
            params=json.dumps(params)
        ).first() \
                is not None:
            raise Exception(
                f"node:{data.get('instance', '')}, There are tasks in progress, {service_name}")

        # 2. Create a task with Ready status
        task_params = {
            "command": "",
            "task_id": task_id,
            "created_by": user_id,
            "params": json.dumps(params),
            "service_name": service_name,
            "status": "Ready"
        }
        return JobModel.objects.create(**task_params)

    @staticmethod
    def offline_import(data: dict, user: dict) -> JobModel:
        """Import offline diagnostic logs as a Job"""
        user_id = user["id"]
        task_id = uuid_8()
        service_name = data.get("service_name", None)
        task_params = {
            "command": "",
            "task_id": task_id,
            "created_by": user_id,
            "params": json.dumps(data),
            "service_name": service_name,
            "status": "Ready"
        }
        return JobModel.objects.create(**task_params)

    @staticmethod
    def preprocess(instance: JobModel) -> bool:
        """"Perform diagnosis preprocessing"""
        success = False
        try:
            service_name = instance.service_name
            params = instance.params
            if isinstance(params, str):
                try:
                    params = json.loads(params)
                except Exception as exc:
                    logger.exception(
                        f"Task params loads error: {str(exc)}")

            # 2. Invoke preprocessing script（preprocessing script）
            SCRIPTS_DIR = settings.SCRIPTS_DIR
            service_path = os.path.join(SCRIPTS_DIR, service_name)
            if not os.path.exists(service_path):
                raise Exception(
                    "Can not find script file, please check service name")
            try:
                command_list = [service_path, json.dumps(params)]
                resp = subprocess.run(command_list, stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE)
            except Exception as exc:
                raise Exception(
                    f"Execute preprocess script error: {str(exc)}"
                ) from exc

            # 3. If the preprocessing script executes with an error
            if resp.returncode != 0:
                raise (Exception(
                    f"Execute preprocess script error: {str(resp.stderr.decode('utf-8'))}"
                ))

            # 4. If the preprocessing script executes successfully,
            #    take out the processing result
            stdout = resp.stdout.decode('utf-8')
            resp = ast.literal_eval(stdout)
            resp_scripts = resp.get("commands")

            # 5. If the preprocessing result not contains 'commands', it's a not expect bug
            if not resp_scripts:
                raise (Exception(
                    f"Not find commands, please check the preprocess script return"
                ))

            # 6. If the preprocessing script executes successfully, the parameters are compliant
            #    and the Job instance is updated
            DiagnosisHelper._update_job(
                instance, command=json.dumps(resp_scripts), status="Running"
            )
            success = True
        except Exception as exc:
            logger.exception(
                f"Diagnosis preprocess error: {str(exc)}")
            DiagnosisHelper._update_job(
                instance, result="Diagnosis preprocess error", status="Fail",
                code=1, err_msg=f"Diagnosis preprocess error: {str(exc)}")
        return success

    def execute(instance: JobModel, result_callback: Callable[[JobResult], None]) -> bool:
        """Execute diagnosis task"""
        success = False
        try:
            resp_scripts = json.loads(instance.command)
            params = instance.params
            if isinstance(params, str):
                try:
                    params = json.loads(params)
                except Exception as exc:
                    raise Exception(
                        f"Task params loads error: {str(exc)}") from exc
            for idx, script in enumerate(resp_scripts):
                job_params = {
                    "channel_type": params.pop("channel", "ssh"),
                    "channel_opt": "cmd",
                    "params": {
                        **params,
                        "instance": script.get("instance", "Unknown"),
                        "command": script.get("cmd", "Unknown"),
                    },
                    "echo": {
                        "task_id": instance.task_id
                    },
                    "timeout": 1000 * 60 * 10,  # 10 minutes
                }
                # 前 n - 1 个命令同步执行
                if idx < len(resp_scripts) - 1:
                    job_result = default_channel_job_executor.dispatch_job(**job_params) \
                        .execute()
                    if job_result.code != 0:
                        raise Exception(
                            f"Task execute failed: {job_result.err_msg}")
                else:
                    # 最后一个命令异步执行
                    default_channel_job_executor.dispatch_job(**job_params) \
                        .execute_async_with_callback(result_callback)
            success = True
        except Exception as exc:
            logger.exception(
                f"Diagnosis execute task error: {str(exc)}")
            DiagnosisHelper._update_job(
                instance, result="Diagnosis execute task error", status="Fail",
                code=1, err_msg=f"Diagnosis execute task error: {str(exc)}")
        return success

    def postprocess(instance: JobModel, job_result: JobResult):
        """Perform diagnosis postprocessing
        JobResult -> {
            "code": 0,          => 0 表示成功，1表示失败
            "err_msg": "",      => 如果任务执行失败，错误信息可以使用这个字段获得
            "result": "xxx",    => 命令执行结果
            "echo": {
                "task_id": 0
            }
        }

        Postprocess script response data format =>
        {
            "code": 0,          => 0 表示成功，1表示失败
            "err_msg": "",      => 如果后处理脚本检测到诊断失败，在这边存放诊断错误信息
            "result": {}        => 后处理脚本处理的结果，应该是一个 JSON Object
        }
        """
        try:
            code = job_result.code
            err_msg = job_result.err_msg
            if code != 0:
                DiagnosisHelper._update_job(
                    instance, status="Fail", code=code,
                    result=job_result.result, err_msg=err_msg)
                return
            # 如果任务执行成功，则执行后处理脚本
            params = instance.params
            if isinstance(params, str):
                try:
                    params = json.loads(params)
                except Exception as exc:
                    raise Exception(
                        f"Task params loads error: {str(exc)}") from exc

            service_name = instance.service_name
            # 执行后处理脚本，将结果整理成前端可识别的规范结构
            SCRIPTS_DIR = settings.SCRIPTS_DIR
            service_post_name = service_name + '_post'
            service_post_path = os.path.join(
                SCRIPTS_DIR, service_post_name)
            if not os.path.exists(service_post_path):
                raise Exception(
                    f"No matching post-processing script found: {service_post_path}")

            # 创建一个临时文件，用于暂存中间结果
            with tempfile.NamedTemporaryFile(mode="w") as tmp_file:
                command_list = [service_post_path,
                                tmp_file.name, instance.task_id]
                try:
                    # 将要传递的中间结果写入到临时文件当中
                    tmp_file.write(job_result.result)
                    tmp_file.flush()
                    resp = subprocess.run(command_list, stdout=subprocess.PIPE,
                                          stderr=subprocess.PIPE)
                except Exception as exc:
                    raise Exception(
                        f"Execute postprocess script error: {str(exc)}"
                    )

                if resp.returncode != 0:
                    raise (Exception(
                        f"Execute postprocess script error: {str(resp.stderr.decode('utf-8'))}"
                    ))
                stdout = resp.stdout
                result = json.loads(stdout.decode('utf-8').strip())
                code = result.get("code", 1)
                if code != 0:
                    err_msg = result.get("err_msg", "Postprocess error")
                    # 后处理脚本认为诊断出错
                    DiagnosisHelper._update_job(
                        instance, err_msg=err_msg, status="Fail")
                else:
                    rel_result = result.get("result", {})
                    # 后处理脚本执行结束，更新任务状态
                    DiagnosisHelper._update_job(
                        instance, result=rel_result, status="Success"
                    )
            pass
        except Exception as exc:
            logger.exception(
                f"Diagnosis postprocess error: {str(exc)}")
            DiagnosisHelper._update_job(
                instance, result="Diagnosis postprocess error", status="Fail",
                code=1, err_msg=f"Diagnosis postprocess error: {str(exc)}")
