'''
Task Service Gunicorn Settings
'''
workers = 2  # 指定工作进程数

threads = 3

bind = '127.0.0.1:7002'

worker_class = 'gevent'  # 工作模式线程, 默认为sync模式

max_requests = 2000      # 设置最大并发数量为2000 (每个worker处理请求的工作线程)

accesslog = '/usr/local/sysom/server/logs/task-service.log'

errorlog = '/usr/local/sysom/server/logs/task-service-error.log'

loglevel = 'info'

proc_name = 'task_service'

raw_env = 'DJANGO_SETTINGS_MODULE=sysom.services_conf.task_settings'
