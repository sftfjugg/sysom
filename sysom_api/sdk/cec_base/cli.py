# -*- coding: utf-8 -*- #
"""
Time                2022/8/3 11:48
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                cli.py
Description:
"""
from prompt_toolkit import PromptSession
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.styles import Style
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from .admin import Admin, dispatch_admin
from .log import LoggerHelper, LoggerLevel
from rich.console import Console
from rich.markdown import Markdown

cmd_completer = WordCompleter([
    'connect',
    'topic', 'add', 'del', 'list', 'exist', 'consumer_group'
], ignore_case=True)

style = Style.from_dict({
    'completion-menu.completion': 'bg:#008888 #ffffff',
    'completion-menu.completion.current': 'bg:#00aaaa #000000',
    'scrollbar.background': 'bg:#88aaaa',
    'scrollbar.button': 'bg:#222222',
})
console = Console()


def print_args_too_much(command: str, args: [str]):
    console.print(Markdown(
        f"""
Input too much args:
- command: {command}
- args: {args}
        """))


def print_args_too_few(command: str, args: [str]):
    console.print(Markdown(
        f"""
Input too few args:
- command: {command}
- args: {args}
        """))


def topic_add(instance: Admin, args: [str]):
    arg_count = len(args)
    if arg_count < 1:
        print_args_too_few("topic add", args)
    elif arg_count > 4:
        print_args_too_much("topic add", args)
    else:
        for i in range(1, len(args)):
            args[i] = int(args[i])
        print(instance.create_topic(*args, ignore_exception=True))


def topic_del(instance: Admin, args: [str]):
    arg_count = len(args)
    if arg_count < 1:
        print_args_too_few("topic del", args)
    elif arg_count > 1:
        print_args_too_much("topic del", args)
    else:
        print(instance.del_topic(*args, ignore_exception=True))


def topic_exist(instance: Admin, args: [str]):
    arg_count = len(args)
    if arg_count < 1:
        print_args_too_few("topic exist", args)
    elif arg_count > 1:
        print_args_too_much("topic exist", args)
    else:
        print(instance.is_topic_exist(*args))


def topic_list(instance: Admin, args: [str]):
    print(instance.get_topic_list())


def consumer_group_add(instance: Admin, args: [str]):
    arg_count = len(args)
    if arg_count < 1:
        print_args_too_few("topic exist", args)
    elif arg_count > 1:
        print_args_too_much("topic exist", args)
    else:
        print(instance.create_consumer_group(*args, ignore_exception=True))


def consumer_group_del(instance: Admin, args: [str]):
    arg_count = len(args)
    if arg_count < 1:
        print_args_too_few("topic exist", args)
    elif arg_count > 1:
        print_args_too_much("topic exist", args)
    else:
        print(instance.del_consumer_group(*args, ignore_exception=True))


def consumer_group_exist(instance: Admin, args: [str]):
    print(instance.is_consumer_group_exist(*args))


def consumer_group_list(instance: Admin, args: [str]):
    print(instance.get_consumer_group_list())


def do_connect(instance: Admin, args: [str]):
    if instance is not None:
        return instance
    url = args[0]
    return dispatch_admin(url)


cli_commands = {
    'topic': {
        'sub_commands': {
            'add': topic_add,
            'del': topic_del,
            'list': topic_list,
            'exist': topic_exist
        },
    },
    'consumer_group': {
        'sub_commands': {
            'add': consumer_group_add,
            'del': consumer_group_del,
            'list': consumer_group_list,
            'exist': consumer_group_exist
        }
    },
    'connect': {
        'func': do_connect
    }
}

usage = """
# Cec-cli
- connect <url>
    > Connect to event center server
    > 
    > 连接到事件中心服务器
    >
    > example: *connect redis://localhost:6379*
    
- topic <add/del/exist/list/info>
    - *topic add <topic_name> [num_partitions] [replication_factor] [expire_time]*
        > Create one topic
        
        > 创建主题
        
        > example: *topic add test_topic*
        
        - topic_name           主题名字（主题的唯一标识
        - num_partitions       该主题的分区数 => 默认为1
            1. 该参数指定了在分布式集群部署的场景下，同一个主题的数据应该被划分为几个分区，分别存储在不同的集群节点上；
            2. 如果底层的消息中间件支持分区（比如：Kafka），则可以依据该配置进行分区；
            3. 如果底层的消息中间件不支持分区（比如：Redis），则忽略该参数即可（认定为只有一个分区即可），可以通过
               Admin.is_support_partitions() 方法判定当前使用的消息中间件实现是否支持该特性；
        - replication_factor   冗余因子（指定该主题的数据又几个副本）=> 默认为1
            1. 该参数制定了在分布式集群部署的场景下，同一个主题的分区存在副本的数量，如果 replication_factor == 1
               则表示主题下的所有分区都只有一个副本，一旦丢失不可回复；
            2. 如果底层的消息中间件支持数据副本，则可以依据该配置进行对应的设置；
            3. 如果底层的消息中间件不支持数据副本，则忽略该参数即可（即认定只有一个副本即可），可以通过
               Admin.is_support_replication() 方法判定当前使用的小心中间件实现是否支持该特性；
        - expire_time   事件超时时间（单位：ms，默认：1day）
            1. 该参数指定了目标 Topic 中每个事件的有效期；
            2. 一旦一个事件的加入到 Topic 的时间超过了 expire_time，则cec不保证该事件
               的持久性，cec应当在合适的时候删除超时的事件；
            3. 不强制要求超时的事件被立即删除，可以对超时的事件进行周期性的清理。
    
    - *topic del <topic_name>*
        > Delete one topic
        >
        > 删除主题
        >
        >  example: *topic del test_topic*
        
        - topic_name           主题名字（主题的唯一标识）
    
    - *topic exist <topic_name>*
        > Judge whether one specific topic is exists
        > 
        > 判断某个主题是否存在
        >
        > example: *topic exist test_topic*
        
        - topic_name           主题名字（主题的唯一标识）
    
    - *topic list*
        > Get topic list
        >
        > 获取主题列表
        >
        > example: *topic list*

- consumer_group <add/del/exist>
    - *consumer_group add <consumer_group_id>*
        > Create one consumer group
        >
        > 创建一个消费组
        >
        > example: *consumer_group add test_consumer*
        
        - consumer_group_id:   消费组ID，应当具有唯一性
        
    - *consumer_group del <consumer_group_id>*
        > Delete one consumer group
        >
        > 删除一个消费组
        >
        > example: *consumer_group del test_consumer*
        
        - consumer_group_id:   消费组ID，应当具有唯一性

    - *consumer_group exist <consumer_group_id>*
        > Judge whether one specific consumer group exists
        >
        > 判断某个消费组是否存在
        >
        > example: *consumer_group exist test_consumer*
        
        - consumer_group_id:   消费组ID，应当具有唯一性
        
    - *consumer_group exist <consumer_group_id>*
        > Get consumer group list
        > 
        > 获取消费组列表
        >
        > example: *consumer_group list*
"""


def print_usage():
    console.print(Markdown(usage))
    pass


def main():
    LoggerHelper.update_sys_stdout_sink(LoggerLevel.LOGGER_LEVEL_DEBUG)

    session = PromptSession(completer=cmd_completer,
                            style=style,
                            history=FileHistory("history.txt"),
                            auto_suggest=AutoSuggestFromHistory())

    admin_instance: Admin = None

    while True:
        try:
            if admin_instance is None:
                console.print(Markdown("Not connected to the server, please "
                                       "use the *connect* command to connect"))
            text = session.prompt('> ').strip()
            if text.strip().lower() == 'quit':
                break
            commands = list(filter(lambda s: s != '', text.split(' ')))
            if len(commands) < 2:
                print_usage()
                continue

            # 取出一级命令
            first_level_command = commands[0]
            if first_level_command not in cli_commands:
                print_usage()
                continue

            if admin_instance is None and first_level_command != 'connect':
                continue

            if 'sub_commands' not in cli_commands[first_level_command]:
                # 没有二级命令，直接执行
                ret = cli_commands[first_level_command]['func'](admin_instance,
                                                                commands[1:])
                if first_level_command == 'connect':
                    admin_instance = ret
                continue

            # 判断是否存在对应的二级命令
            second_level_command = commands[1]
            if second_level_command \
                    not in cli_commands[first_level_command]['sub_commands']:
                print_usage()
                continue
        except KeyboardInterrupt:
            continue
        except EOFError:
            break
        else:
            cli_commands[first_level_command]['sub_commands'][
                second_level_command](admin_instance, commands[2:])
    print("GoodBye!")


if __name__ == '__main__':
    main()
