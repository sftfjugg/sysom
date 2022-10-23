import json
import os
import subprocess
import logging
import tempfile
import ast
from apps.task.models import JobModel
from django.conf import settings
from django.db import connection
from lib.utils import uuid_8
from cec_base.cec_client import CecClient
from cec_base.event import Event
from cec_base.consumer import Consumer
from cec_base.producer import Producer
from .seriaizer import JobDetailSerializer


logger = logging.getLogger(__name__)


class TaskDispatcher(CecClient):
    """A asynchronous task dispatcher implement
    一个异步任务分发器实现，对于每一个需要分发的异步任务：
    1. 首先，通过 cec_base 接口将任务发布到事件中心；
    2. 要求处理任务的微服务从事件中心消费事件进行处理，并将事件处理的结果投递到事件中心；
       => 通过组消费的方式，单个实例处理不过来时，可以通过水平扩容，拉起多个实例进行处理。
    3. 最后任务执行器从事件中心异步取回任务执行的结果。
    """

    def __init__(self, url: str) -> None:
        CecClient.__init__(self, url)

    def start_dispatcher(self):
        self.append_group_consume_task(
            settings.SYSOM_CEC_CHANNEL_RESULT_TOPIC,
            settings.SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP,
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )
        self.append_group_consume_task(
            settings.SYSOM_CEC_PLUGIN_TOPIC,
            settings.SYSOM_CEC_DIAGNOSIS_CONSUMER_GROUP,
            Consumer.generate_consumer_id(),
            ensure_topic_exist=True
        )
        self.start()

    def on_receive_event(self, consumer: Consumer, producer: Producer, event: Event, task: dict):
        try:
            topic_name = task.get("topic_name", "unknown_topic")
            if topic_name == settings.SYSOM_CEC_CHANNEL_RESULT_TOPIC:
                # Deal task process result
                self._process_task_result(event)
            elif topic_name == settings.SYSOM_CEC_PLUGIN_TOPIC:
                self._process_plugin_event(event)
            # elif topic_name == settings.SYSOM_CEC_TASK_GENERATE_TOPIC:
            #     # Deal generate task
            #     self._generate_task(event)
        except Exception as exc:
            logger.exception(exc)
        finally:
            consumer.ack(event)

    ################################################################################################
    # 插件系统相关事件处理
    ################################################################################################
    def _process_plugin_event(self, event: Event):
        """Process plugin event

        {
            "type": "clean",
            "params": {
                "channel": "ssh",
                "host": instance.ip,
                "username": instance.username,
                "port": instance.port
            },
            "echo": {
                "instance": params.get("host", "Unknown host"),
                "label": "host_init"
            }
        }
        """
        value = event.value
        plugin_event_type = value.get("type", "Unknown type")
        if plugin_event_type == "init":
            params = value.get("params", {})
            token = params.pop("token", "")
            self._generate_task({
                "token": token,
                "data": {
                    **params,
                    "service_name": "node_init"
                }
            })
        elif plugin_event_type == "clean":
            params = value.get("params", {})
            token = params.pop("token", "")
            self._generate_task({
                "token": token,
                "data": {
                    **params,
                    "service_name": "node_delete"
                }
            })

    ################################################################################################
    # 诊断任务下发
    ################################################################################################

    def _generate_task(self, params: dict):
        from lib.authentications import decode_token
        try:
            token = params.get("token", "")
            data = params.get("data", {})
            data["user"] = decode_token(token)
            self.delivery_task(data)
        except Exception as exc:
            # TODO: 任务下发过程中发生任何错误，都应该反馈错误到事件中心
            logger.exception(exc)

    def delivery_task(self, data: dict):
        """
        将一个任务投递到事件中心，供任务执行者消费
        Returns:
        """
        try:
            # 取出鉴权中间件填充的用户信息，用于将 Job 关联到 User
            user = data.pop("user")
            user_id = user["id"]
            params = data.copy()
            service_name = data.pop("service_name", None)
            task_id = uuid_8()
            # 如果相同参数的诊断任务之前已经下发，并且还在执行，则禁止重复下发
            task = JobModel.objects.filter(status="Running", params=params)
            if task:
                return {
                    "message": f"node:{params['instance']}, There are tasks in progress, {params['service_name']}",
                    "success": False
                }
            # 调用预处理脚本（preprocessing script）
            SCRIPTS_DIR = settings.SCRIPTS_DIR
            service_path = os.path.join(SCRIPTS_DIR, service_name)
            if not os.path.exists(service_path):
                logger.error(
                    "can not find script file, please check service name")
                return {
                    "message": "can not find script file, please check service name",
                    "success": False
                }
            try:
                command_list = [service_path, json.dumps(data)]
                resp = subprocess.run(command_list, stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE)
            except Exception as e:
                # 执行预处理脚本过程中出现异常
                JobModel.objects.create(command='', task_id=task_id,
                                        created_by=user_id, result=str(e), status="Fail")
                logger.error(e, exc_info=True)
                return {
                    "message": str(e),
                    "success": False
                }
            # 预处理脚本执行出错
            if resp.returncode != 0:
                logger.error(str(resp.stderr.decode('utf-8')))
                JobModel.objects.create(command='', task_id=task_id,
                                        created_by=user_id, result=resp.stderr.decode('utf-8'), status="Fail")
                return {
                    "message": str(resp.stderr.decode('utf-8')),
                    "success": False
                }
            # 预处理脚本执行成功，取出处理结果
            stdout = resp.stdout.decode('utf-8')
            resp = ast.literal_eval(stdout)
            resp_scripts = resp.get("commands")
            # 如果预处理脚本执行结果中不包含 commands，说明脚本写的有问题，这是不预期的行为
            if not resp_scripts:
                logger.error(
                    "not find commands, Please check the script return")
                JobModel.objects.create(command='', task_id=task_id,
                                        created_by=user_id, result="not find commands, Please check the script return",
                                        status="Fail")
                return {
                    "message": "not find commands, Please check the script return",
                    "success": False
                }
            # 如果预处理脚本执行成功，说明参数合规，创建 Job 实例
            task = {
                "command": json.dumps(resp_scripts),
                "task_id": task_id,
                "created_by": user_id,
                "params": params,
                "status": "Running"
            }
            try:
                JobModel.objects.create(**task)
            except:
                raise Exception('任务创建失败!')

            # 将任务下发到事件中心，异步执行
            self.delivery(settings.SYSOM_CEC_CHANNEL_TOPIC, {
                "channel": data.pop("channel", "ssh"),
                "type": "cmd",
                "params": {
                    **data,
                    "command": resp_scripts[0].get("cmd", "Unknown")
                },
                "echo": {
                    "task_id": task_id
                }
            })
            # 任务创建成功，返回任务ID
            return {
                "success": True,
                "result": {"instance_id": task_id}
            }
        except Exception as e:
            logger.error(e, exc_info=True)
            return {
                "message": str(e),
                "success": False
            }

    ################################################################################################
    # 诊断结果处理
    ################################################################################################

    def _process_task_result(self, event: Event):
        """
        处理任务执行结果回调
        {
            "code": 0,          => 0 表示成功，1表示失败
            "err_msg": "",      => 如果任务执行失败，错误信息可以使用这个字段获得
            "result": "xxx",    => 命令执行结果
            "echo": {
                "task_id": 0
            }
        }
        """
        def update_job(instance: JobModel, **kwargs):
            try:
                instance.__dict__.update(**kwargs)
                instance.save()
            except Exception as e:
                raise e
            finally:
                connection.close()
        task_result = event.value
        code = task_result.get("code", 1)
        err_msg = task_result.get("err_msg", "")
        result = task_result.get("result", "")
        echo = task_result.get("echo", {})
        if "task_id" not in echo or not echo.get("task_id"):
            return

        task = {}
        instance = None
        try:
            task_id = echo.get("task_id")
            # 获取到 Task 实例
            instance = JobModel.objects.get(task_id=task_id)
            # 如果任务执行失败，更新状态
            if code != 0:
                update_job(instance, status="Fail", result=err_msg)
                return
            # 如果任务执行成功，则执行后处理脚本
            params = instance.params
            service_name = params.get("service_name", "unknown")
            # 执行后处理脚本，将结果整理成前端可识别的规范结构
            SCRIPTS_DIR = settings.SCRIPTS_DIR
            service_post_name = service_name + '_post'
            service_post_path = os.path.join(
                SCRIPTS_DIR, service_post_name)
            if os.path.exists(service_post_path):
                # 创建一个临时文件，用于暂存中间结果
                fd, path = tempfile.mkstemp()
                command_list = [service_post_path,
                                path, instance.task_id]
                try:
                    # 将要传递的中间结果写入到临时文件当中
                    with os.fdopen(fd, 'w') as tmp:
                        tmp.write(result)
                    resp = subprocess.run(command_list, stdout=subprocess.PIPE,
                                          stderr=subprocess.PIPE)
                    if resp.returncode != 0:
                        logger.error(
                            f'执行失败: {resp.stderr.decode("utf-8")}')
                        update_job(instance, status="Fail",
                                   result=resp.stderr.decode('utf-8'))
                    stdout = resp.stdout
                    result = json.loads(stdout.decode('utf-8'))
                except Exception as e:
                    logger.error(f'ERROR: {e}')
                    update_job(instance, status="Fail", result=str(e))
                    return
            # 后处理脚本执行结束，更新任务状态
            update_job(instance, status="Success", result=result)
        except Exception as e:
            code = 1
            err_msg = str(e)
            logger.error(e)
        finally:
            if instance is not None:
                task = JobDetailSerializer(instance).data
            # 将诊断任务最后是否执行成功写到事件中心当中
            self.delivery(settings.SYSOM_CEC_DIAGNOSIS_RESULT_TOPIC, {
                "code": code,
                "err_msg": err_msg,
                "task": task
            })
