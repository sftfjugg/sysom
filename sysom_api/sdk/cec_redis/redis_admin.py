# -*- coding: utf-8 -*- #
"""
Time                2022/7/25 14:48
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                redis_admin.py
Description:
"""
import json
import sys
from typing import Optional

from ..cec_base.admin import Admin, ConsumeStatusItem
from ..cec_base.admin import TopicNotExistsException, TopicAlreadyExistsException
from ..cec_base.admin import ConsumerGroupNotExistsException
from ..cec_base.admin import ConsumerGroupAlreadyExistsException
from ..cec_base.base import raise_if_not_ignore, CecException
from ..cec_base.event import Event
from ..cec_base.meta import TopicMeta, PartitionMeta, ConsumerGroupMeta, \
    ConsumerGroupMemberMeta
from ..cec_base.log import LoggerHelper
from ..cec_base.url import CecUrl
from redis import Redis
from redis.exceptions import ResponseError

from .utils import do_connect_by_cec_url
from loguru import logger
from itertools import chain
from .consume_status_storage import ConsumeStatusStorage
from .common import StaticConst, ClientBase


class RedisAdmin(Admin, ClientBase):
    """A redis-based execution module implement of Admin

    一个基于 Redis 实现的执行模块中的 Admin 实现

    """

    def __init__(self, url: CecUrl):
        Admin.__init__(self)
        ClientBase.__init__(self, url)
        self._redis_client: Redis = None
        self._current_url: str = ""
        self.connect_by_cec_url(url)

    ####################################################################
    # 事件中心接口实现
    ####################################################################
    @staticmethod
    @logger.catch(reraise=True)
    def static_create_topic(redis_client: Redis, topic_name: str = "",
                            num_partitions: int = 1,
                            replication_factor: int = 1,
                            ignore_exception: bool = False,
                            expire_time: int = 24 * 60 * 60 * 1000) -> bool:
        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} try to create_topic <topic_name="
            f"{topic_name}, num_partitions={num_partitions}"
            f", replication_factor={replication_factor},"
            f" expire_time={expire_time}>.")
        # 内部表征 Topic 的 Stream 的 Key，拼接了特殊的前缀作为命名空间
        inner_topic_name = StaticConst.get_inner_topic_name(
            topic_name)
        result = True
        try:
            # 加锁
            if not RedisAdmin._lock_topic(redis_client, topic_name,
                                          ignore_exception):
                return False
            # 1. 判断 Topic 是否存在
            if RedisAdmin.static_is_topic_exist(redis_client,
                                                topic_name):
                raise TopicAlreadyExistsException(
                    f"Topic {topic_name} already "
                    f"exists."
                )
            else:
                # 2. 使用 xadd 触发 stream 创建
                event_id = redis_client.xadd(inner_topic_name, {
                    "test": 1
                })

                pl = redis_client.pipeline()
                # 3. 删除刚才添加的测试事件，清空 stream
                pl.xdel(inner_topic_name, event_id)

                # 4. 将新建的 Topic 加入到 Topic 集合当中（便于获取所有 Topic 列表）
                pl.sadd(StaticConst.REDIS_ADMIN_TOPIC_LIST_SET,
                        inner_topic_name)
                pl.execute()
        except Exception as e:
            raise_if_not_ignore(ignore_exception, e)
        finally:
            # 解锁
            RedisAdmin._unlock_topic(redis_client, topic_name)

        LoggerHelper.get_lazy_logger().success(
            f"{redis_client} create_topic '{topic_name}' successfully.")
        return result

    @logger.catch(reraise=True)
    def create_topic(self, topic_name: str = "", num_partitions: int = 1,
                     replication_factor: int = 1,
                     ignore_exception: bool = False,
                     expire_time: int = 24 * 60 * 60 * 1000) -> bool:
        """Create one topic

        创建一个 Topic => 对应到 Redis 应该是创建一个 Stream：
            1. 首先判断 Topic 是否已经存在，如果已经存在，则抛出异常；
            2. 接着使用 xadd 命令触发 stream 的创建过程；
            3. 最后将刚才插入的测试数据删掉，清空 stream
            4. 将 topic_name 加入到特定的 set 集合当中
              （该集合包含了所有通过 CEC 创建的 Topic 名称列表）

        TODO: 此处需要进一步考虑是否使用事务，防止中间某一步执行出错，状态不一致

        Args:
            topic_name: 主题名字（主题的唯一标识）
            num_partitions: 该主题的分区数

                1. 该参数指定了在分布式集群部署的场景下，同一个主题的数据应该被划分为几个分区，分别存储在不同的集群节点上；
                2. 如果底层的消息中间件支持分区（比如：Kafka），则可以依据该配置进行分区；
                3. 如果底层的消息中间件不支持分区（比如：Redis），则忽略该参数即可（认定为只有一个分区即可），可以通过
                   Admin.is_support_partitions() 方法判定当前使用的消息中间件实现是否支持该特性；

            replication_factor: 冗余因子（指定该主题的数据又几个副本）

                1. 该参数制定了在分布式集群部署的场景下，同一个主题的分区存在副本的数量，如果 replication_factor == 1
                   则表示主题下的所有分区都只有一个副本，一旦丢失不可回复；
                2. 如果底层的消息中间件支持数据副本，则可以依据该配置进行对应的设置；
                3. 如果底层的消息中间件不支持数据副本，则忽略该参数即可（即认定只有一个副本即可），可以通过
                   Admin.is_support_replication() 方法判定当前使用的小心中间件实现是否支持该特性；

            ignore_exception: 是否忽略可能会抛出的异常
            expire_time: 事件超时时间（单位：ms，默认：1day）

                1. 该参数指定了目标 Topic 中每个事件的有效期；
                2. 一旦一个事件的加入到 Topic 的时间超过了 expire_time，则cec不保证该事件
                   的持久性，cec应当在合适的时候删除超时的事件；
                3. 不强制要求超时的事件被立即删除，可以对超时的事件进行周期性的清理。

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            TopicAlreadyExistsException: If topic already exists
            CecException: Get lock failed

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.create_topic("test_topic")
            True
        """
        return RedisAdmin.static_create_topic(self._redis_client,
                                              topic_name,
                                              num_partitions,
                                              replication_factor,
                                              ignore_exception,
                                              expire_time)

    @staticmethod
    @logger.catch(reraise=True)
    def static_del_topic(redis_client: Redis, topic_name: str,
                         ignore_exception: bool = False) -> bool:
        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} try to del_topic <topic_name={topic_name}>.")

        inner_topic_name = StaticConst.get_inner_topic_name(
            topic_name)

        try:
            # 加锁
            if not RedisAdmin._lock_topic(redis_client, topic_name,
                                          ignore_exception):
                return False
            # 1. 判断是否存在
            if not RedisAdmin.static_is_topic_exist(redis_client,
                                                    topic_name):
                raise_if_not_ignore(ignore_exception,
                                    TopicNotExistsException(
                                        f"Topic {topic_name} not exists."
                                    ))
            pl = redis_client.pipeline()

            # 2. 删除对应的 stream（topic）
            pl.delete(inner_topic_name)

            # 3. 将当前 topic 从 topic 列表中移除
            pl.srem(StaticConst.REDIS_ADMIN_TOPIC_LIST_SET,
                    inner_topic_name)

            pl.execute()

            # 4. 清除 TOPIC 相关的元数据信息
            RedisAdmin.del_topic_meta(redis_client, topic_name)

            # 5. 删除 TOPIC 关联的用于存储消费状态的结构
            ConsumeStatusStorage.destroy_by_stream(redis_client, topic_name)
        except Exception as e:
            raise_if_not_ignore(ignore_exception, e)
        finally:
            # 解锁
            RedisAdmin._unlock_topic(redis_client, topic_name)

        LoggerHelper.get_lazy_logger().success(
            f"{redis_client} del_topic '{topic_name}' successfully.")
        return True

    @logger.catch(reraise=True)
    def del_topic(self, topic_name: str,
                  ignore_exception: bool = False) -> bool:
        """Delete one topic

        删除一个 Topic => 对应到 Redis 应该是删除一个 Stream
            1. 直接删除 Stream 对应的key即可
            2. 清楚一些相关的元数据信息

        Args:
          topic_name: 主题名字（主题的唯一标识）
          ignore_exception: 是否忽略可能会抛出的异常

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            TopicNotExistsException: If topic not exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.del_topic("test_topic")
            True
        """
        return RedisAdmin.static_del_topic(self._redis_client, topic_name,
                                           ignore_exception)

    @staticmethod
    @logger.catch(reraise=True)
    def static_is_topic_exist(redis_client: Redis,
                              topic_name: str) -> bool:
        res = redis_client.type(
            StaticConst.get_inner_topic_name(topic_name)) == 'stream'
        LoggerHelper.get_lazy_logger().debug(
            f"Is topic {topic_name} exists? => {res}.")
        return res

    @logger.catch(reraise=True)
    def is_topic_exist(self, topic_name: str) -> bool:
        """Judge whether one specific topic is exists

        判断 Topic 是否存在 => 对应到 Redis 应该是判断是否存最对应stream
            1. 使用 type 命令判断key对应的类型是否是 stream

        Args:
            topic_name: 主题名字（主题的唯一标识）

        Returns:
            bool: True if topic exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_topic_exist("test_topic")
            True
        """
        return RedisAdmin.static_is_topic_exist(self._redis_client,
                                                topic_name)

    @staticmethod
    @logger.catch(reraise=True)
    def static_get_topic_list(redis_client: Redis) -> [str]:
        res = redis_client.smembers(StaticConst.REDIS_ADMIN_TOPIC_LIST_SET)
        topics = []
        for inner_topic_name in res:
            topic_meta = TopicMeta(
                StaticConst.get_topic_name_by_inner_topic_name(
                    inner_topic_name))
            topic_meta.partitions = {
                0: PartitionMeta(0)
            }
            topics.append(topic_meta)

        LoggerHelper.get_lazy_logger().debug(
            f"get_topic_list => {res}.")
        return topics

    @logger.catch(reraise=True)
    def get_topic_list(self) -> [str]:
        """Get topic list

        获取 Topic 列表 => 对应到 Redis 应该是获取所有 Stream 的列表
            1. 本实现创建了一个特殊的 Set，保存了由本套接口创建的所有 Stream 的key；
            2. 所以只需要查询该 Set，获取到所有的key即可

        Args:

        Returns:
            [str]: The topic name list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_topic_list()
            ['test_topic']
        """
        return RedisAdmin.static_get_topic_list(self._redis_client)

    @staticmethod
    @logger.catch(reraise=True)
    def get_meta_info(client: Redis, topic_name: str) -> Optional[dict]:
        """Get topic's meta info

        获取特定 Topic 的元数据信息

        Args:
          client(Redis): Redis client
          topic_name(str): topic name

        Returns:
            TopicMeta: the topic meta info object
        """
        try:
            res = client.xinfo_stream(
                StaticConst.get_inner_topic_name(topic_name))
        except ResponseError:
            return None
        LoggerHelper.get_lazy_logger().debug(
            f"get_meta_info => {res}.")
        return {
            'topic_name': topic_name,
            **res
        }

    @staticmethod
    @logger.catch(reraise=True)
    def static_create_consumer_group(redis_client: Redis,
                                     consumer_group_id: str,
                                     ignore_exception: bool = False) -> bool:
        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} try to create_consumer_group "
            f"<consumer_group_id={consumer_group_id}>.")

        # 使用set给create/del操作加锁（防止并发场景下重复创建删除问题）
        try:
            # 加锁
            if not RedisAdmin._lock_consumer_group(redis_client,
                                                   consumer_group_id,
                                                   ignore_exception):
                return False
            if RedisAdmin.static_is_consumer_group_exist(redis_client,
                                                         consumer_group_id):
                if ignore_exception:
                    return False
                else:
                    raise ConsumerGroupAlreadyExistsException(
                        f"Consumer group {consumer_group_id} already exists.")
            # 添加到消费组key集合当中
            redis_client.sadd(
                StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
                consumer_group_id)
        except Exception as e:
            raise_if_not_ignore(ignore_exception, e)
        finally:
            # 解锁
            RedisAdmin._unlock_consumer_group(redis_client,
                                              consumer_group_id)
        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} create_consumer_group "
            f"'{consumer_group_id}' successfully.")
        return True

    @logger.catch(reraise=True)
    def create_consumer_group(self, consumer_group_id: str,
                              ignore_exception: bool = False) -> bool:
        """Create one consumer group

        创建一个消费组
            1. Redis 中消费组的概念是对每个 Stream 来讲的，同一个消费组不能消费多个
               Stream；
            2. 本实现创建了一个特殊的 Set，保存了由本套接口创建的所有消费组，在对某个
               Stream 进行组消费时，如果组不存在则创建。
            3. 再以 ConsumerId 为 key，创建一个 List，保存和该消费者相关的所有的
               Stream，用于保障删除一个消费组时，可以删除所有 Stream 中的同名消费组

        Args:
            consumer_group_id: 消费组ID，应当具有唯一性
            ignore_exception: 是否忽略可能会抛出的异常

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            ConsumerGroupAlreadyExistsException: If consumer group already
            exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.create_consumer_group("test_group")
            True
        """
        return RedisAdmin.static_create_consumer_group(self._redis_client,
                                                       consumer_group_id,
                                                       ignore_exception)

    @staticmethod
    @logger.catch(reraise=True)
    def static_del_consumer_group(redis_client: Redis,
                                  consumer_group_id: str,
                                  ignore_exception: bool = False) -> bool:
        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} try to del_consumer_group "
            f"<consumer_group_id={consumer_group_id}>.")

        try:
            # 加锁
            if not RedisAdmin._lock_consumer_group(
                    redis_client, consumer_group_id, ignore_exception
            ):
                return False

            # 1. 首先判断消费组是否存在，不存在则根据情况抛出异常
            if not RedisAdmin.static_is_consumer_group_exist(redis_client,
                                                             consumer_group_id):
                raise_if_not_ignore(ignore_exception,
                                    ConsumerGroupNotExistsException(
                                        f"Consumer group {consumer_group_id} "
                                        f"not exists."
                                    ))

            # 2. 从消费组集合中移除
            redis_client.srem(
                StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
                consumer_group_id)

            # 3. 销毁当前消费组关联的所有stream中的同名消费组结构
            streams = redis_client.lpop(
                RedisAdmin.get_sub_list_key(consumer_group_id),
                sys.maxsize
            )
            pl = redis_client.pipeline()
            for stream in streams:
                # 取消订阅主题
                pl.xgroup_destroy(stream, consumer_group_id)

                # 删除对应的 zset
                ConsumeStatusStorage.destroy_by_stream_group(pl, stream,
                                                             consumer_group_id)
            pl.execute()
            for stream in streams:
                # 清除主题-消费组相关的元数据信息
                RedisAdmin.del_topic_consumer_group_meta(redis_client, stream,
                                                         consumer_group_id)
        except ConsumerGroupNotExistsException as e:
            raise_if_not_ignore(ignore_exception, e)
        except Exception as e:
            print(e)
            # 此处忽略 Pipeline 执行清理操作可能产生的错误
            pass
        finally:
            # 解锁
            RedisAdmin._unlock_consumer_group(redis_client,
                                              consumer_group_id)

        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} del_consumer_group "
            f"'{consumer_group_id}' successfully.")
        return True

    @logger.catch(reraise=True)
    def del_consumer_group(self, consumer_group_id: str,
                           ignore_exception: bool = False) -> bool:
        """Delete one consumer group

        删除消费组
            1. 首先判断消费组是否存在，不存在则根据情况抛出异常
            2. 首先在消费组 key 集合中移除当前消费组；
            3. 然后找到消费组关联的所有的stream，执行destroy操作

        Args:
            consumer_group_id: 消费组ID
            ignore_exception: 是否忽略可能会抛出的异常

        Returns:
            bool: True if successful, False otherwise.

        Raises:
            ConsumerGroupNotExistsException: If consumer group not exists

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.del_consumer_group("test_group")
            True
        """
        return RedisAdmin.static_del_consumer_group(self._redis_client,
                                                    consumer_group_id,
                                                    ignore_exception)

    @staticmethod
    @logger.catch(reraise=True)
    def static_is_consumer_group_exist(redis_client: Redis,
                                       consumer_group_id: str) -> bool:
        res = redis_client.sismember(
            StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
            consumer_group_id)

        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} Is consumer group '{consumer_group_id}' exists => {res}")
        return res

    @logger.catch(reraise=True)
    def is_consumer_group_exist(self, consumer_group_id: str) -> bool:
        """Judge whether one specific consumer group exists

        判断指定的消费组是否存在
            1. 判断存储所有消费组 key 的 Set 中是否包含指定的消费者id；
            2. 同时判断 consumer_group_id 是否是一个key，如果被占用，也报已存在，不允许
               创建
        TODO: 此处要考虑是否需要并发安全

        Args:
            consumer_group_id: 消费组ID

        Returns:
            bool: True if consumer group exists, False otherwise.

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.is_consumer_group_exist("test_group")
            True
        """
        return RedisAdmin.static_is_consumer_group_exist(
            self._redis_client,
            consumer_group_id)

    @staticmethod
    @logger.catch(reraise=True)
    def static_get_consumer_group_list(redis_client: Redis) \
            -> [ConsumerGroupMeta]:

        res = redis_client.smembers(
            StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LIST_SET)
        group_metas = []
        for group_id in res:
            group_meta = ConsumerGroupMeta(group_id)
            try:
                # 得到改消费组所有订阅的主题信息
                sub_topics = redis_client.lrange(
                    RedisAdmin.get_sub_list_key(group_id), 0, -1
                )

                # 遍历所有的主题，得到所有的成员
                pl = redis_client.pipeline(transaction=True)
                for topic in sub_topics:
                    pl.xinfo_consumers(topic, group_id)

                # {"name":"Alice","pending":1,"idle":9104628}
                for consumer in chain.from_iterable(pl.execute()):
                    group_meta.members.append(
                        ConsumerGroupMemberMeta(consumer['name']))
            except Exception as e:
                group_meta.error = e
            else:
                group_metas.append(group_meta)

        LoggerHelper.get_lazy_logger().debug(
            f"get_consumer_group_list => {res}.")
        return group_metas

    @logger.catch(reraise=True)
    def get_consumer_group_list(self) -> [ConsumerGroupMeta]:
        """Get consumer group list

        获取消费组列表
            1. 由于在 Redis 中，消费组是属于 Stream 的，不同 Stream 的消费组是独立的，
               为了实现出同一个消费组可以消费不同 Topic 的目的，使用一个特殊的 set
               _REDIS_ADMIN_CONSUMER_GROUP_LIST_SET => 存储了所有的消费组的名字
            2. 当某个消费组试图消费一个 Stream 时，cec-redis 会自动判断 Stream 中是否
               包含该消费组，如果不包含则自动创建；
            3. 因此可以直接通过 _REDIS_ADMIN_CONSUMER_GROUP_LIST_SET 获取消费组列表

        Returns:
            [str]: The consumer group list

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.get_consumer_group_list()
            ['test_group']
        """
        return RedisAdmin.static_get_consumer_group_list(
            self._redis_client)

    @logger.catch(reraise=True)
    def get_consume_status(self, topic: str, consumer_group_id: str = "",
                           partition: int = 0) -> [ConsumeStatusItem]:
        """Get consumption info for specific <topic, consumer_group, partition>

        获取特定消费者组对某个主题下的特定分区的消费情况，应包含以下数据
        1. 最小ID（最小 offset）=> xinfo stream (first-entry)
        2. 最大ID（最大 offset）=> xinfo stream (last-entry)
        3. 分区中存储的事件总数（包括已消费的和未消费的）=> xlen / xinfo stream (length)
        4. 最后一个当前消费组在该分区已确认的事件ID（最后一次消费者确认的事件的ID）
           => 使用 Redis 的一个主题相关的 key 存储了最后一次ack的ID，从中提取即可
        5. 分区的消息堆积数量 LAG（已经提交到该分区，但是没有被当前消费者消费或确认的事件数量）
           => xinfo stream (entries-added) 可以得到历史加入到主题的事件数量
           => xinfo group (entries-read) 可以得到当前消费组已经读取的事件数量
           => 两者相减能得到消息堆积数量

        Args:
            topic: 主题名字
            consumer_group_id: 消费组ID
                1. 如果 consumer_group_id 为空字符串或者None，则返回订阅了该主题的所有
                   消费组的消费情况；=> 此时 partition 参数无效（将获取所有分区的消费数据）
                2. 如果 consumer_group_id 为无效的组ID，则抛出异常；
                3. 如果 consumer_group_id 为有效的组ID，则只获取该消费组的消费情况。
            partition: 分区ID（Redis不支持分区，因此此参数在 cec-redis 的实现里面只有一个合法值0）
                1. 如果 partition 指定有效非负整数 => 返回指定分区的消费情况
                2. 如果 partition 指定无效非负整数 => 抛出异常
                3. 如果 partition 指定负数 => 返回当前主题下所有分区的消费情况

        Raises:
            CecException

        Returns:

        """
        inner_topic_name = StaticConst.get_inner_topic_name(topic)

        # 使用 xinfo stream 获取主题信息
        try:
            stream_info = self._redis_client.xinfo_stream(inner_topic_name)
            min_id, max_id, length, entries_added = None, None, 0, 0
            if 'first-entry' in stream_info:
                min_id = stream_info['first-entry'][0]
            if 'last-entry' in stream_info:
                max_id = stream_info['last-entry'][0]
            if 'length' in stream_info:
                length = stream_info['length']
            groups = self._redis_client.xinfo_groups(inner_topic_name)
            if consumer_group_id != '' and consumer_group_id is not None:
                select_group = None
                # 尝试获取指定消费组的消费信息
                for group in groups:
                    if group.get('name') == consumer_group_id:
                        select_group = group
                        break
                if select_group is None:
                    # 消费组不存在
                    raise CecException(
                        f"Consumer group {consumer_group_id} not exists or did "
                        f"not subscribe topic {topic}")

                # 由于目前 cec-redis 的实现不支持分区，因此每个主题有且只有一个分区号
                # 并且分区号为0，如果在指定了消费组的情况下，传入的分区号 <= 0视为有效；
                # 传入的分区号 > 0 视为无效
                if partition > 0:
                    raise CecException(
                        f"Topic {topic} did not contains partition {partition}"
                    )

                # 此处只需将指定消费组的消费情况返回即可
                last_ack_id = self.get_topic_consumer_group_meta(
                    self._redis_client, topic, select_group.get('name'),
                    StaticConst.TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID
                )

                # 获取 LAG
                if self.is_gte_7(self._redis_client):
                    lag = select_group['lag'] + select_group['pending']
                else:
                    lag = ConsumeStatusStorage.get_already_ack_count(
                        self._redis_client, topic, consumer_group_id
                    )

                # 返回指定消费组的消费情况
                return [
                    ConsumeStatusItem(
                        topic, consumer_group_id, 0,
                        min_id, max_id, length,
                        last_ack_id, lag
                    )
                ]
            else:
                # 获取所有消费组的消费情况（此时 partition 参数无效）
                res, counts_map = [], {}
                if not self.is_gte_7(self._redis_client):
                    # 如果 Redis 版本小于7，将使用 ConsumeStatusStorage 获取 lag
                    pl = self._redis_client.pipeline()
                    for group in groups:
                        ConsumeStatusStorage.get_already_ack_count(
                            pl, topic, group.get('name')
                        )
                    counts = pl.execute()
                    for i in range(len(groups)):
                        counts_map[groups[i].get('name')] = counts[i]

                for group in groups:
                    last_ack_id = self.get_topic_consumer_group_meta(
                        self._redis_client, topic, group.get('name'),
                        StaticConst.TOPIC_CONSUMER_GROUP_META_KEY_LAST_ACK_ID
                    )

                    # 获取 LAG
                    if 'lag' in group and 'pending' in group:
                        lag = group['lag'] + group['pending']
                    else:
                        lag = length - counts_map[group.get('name')]

                    res.append(ConsumeStatusItem(
                        topic, group['name'], 0,
                        min_id, max_id, length,
                        last_ack_id, lag
                    ))
                return res
        except Exception as e:
            raise CecException(e)

    @logger.catch(reraise=True)
    def get_event_list(self, topic: str, partition: int, offset: str,
                       count: int) -> [Event]:
        """ Get event list for specific <topic, partition>

        获取特定主题在指定分区下的消息列表 => Redis 中使用 xrange 命令获取 stream 中的消息
        1. offset 和 count 用于分页
        Args:
            topic: 主题名字
            partition: 分区ID => Redis 中无分区，因此次参数无效
            offset: 偏移（希望读取在该 ID 之后的消息）
            count: 最大读取数量

        References:
            https://redis.io/commands/xrange/

        Returns:

        """
        inner_topic_name = StaticConst.get_inner_topic_name(topic)
        messages = self._redis_client.xrange(
            inner_topic_name,
            min=f"({offset}",
            max='+',
            count=count
        )
        res = []
        for message in messages:
            message_content = json.loads(
                message[1][StaticConst.REDIS_CEC_EVENT_VALUE_KEY])
            res.append(Event(message_content, message[0]))
        return res

    @staticmethod
    @logger.catch(reraise=True)
    def add_group_to_stream(redis_client: Redis, stream: str,
                            consumer_group_id: str) -> bool:
        """Add one consumer group to stream

        将消费组添加到对应的stream中

        Args:
          redis_client(Redis): Redis client
          stream(str): Stream(Topic) name
          consumer_group_id(str): Consumer group id

        Returns:
            bool: True if successfully, False otherwise.
        """
        inner_topic_name = StaticConst.get_inner_topic_name(stream)
        try:
            LoggerHelper.get_lazy_logger().debug(
                f"try to add consumer group '{consumer_group_id}"
                f"' to topic '{stream}'.")
            redis_client.xgroup_create(
                inner_topic_name,
                consumer_group_id, id="0-0")
        except ResponseError:
            # 消费组已存在
            LoggerHelper.get_lazy_logger().debug(
                f"Consumer group '{consumer_group_id}"
                f"' already exists.")
            return False
        except Exception as e:
            raise e
        else:
            # 消费组创建成功，进行关联
            redis_client.lpush(
                RedisAdmin.get_sub_list_key(consumer_group_id),
                inner_topic_name
            )
        LoggerHelper.get_lazy_logger().debug(
            f"Add consumer group '{consumer_group_id}"
            f"' to topic '{stream}' successfully.")
        return True

    @logger.catch(reraise=True)
    def is_support_partitions(self) -> bool:
        return False

    @logger.catch(reraise=True)
    def is_support_replication(self) -> bool:
        return False

    @logger.catch(reraise=True)
    def connect_by_cec_url(self, url: CecUrl):
        """Connect to redis server by CecUrl

        通过 CecUrl 连接到 Redis 服务器

        Args:
          url(str): CecUrl
        """
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to connect to '{url}'.")
        self._redis_client = do_connect_by_cec_url(url)
        self._current_url = url.__str__()
        LoggerHelper.get_lazy_logger().success(
            f"{self} connect to '{url}' successfully.")

    @logger.catch(reraise=True)
    def connect(self, url: str):
        """Connect to redis server by url

        连接到远端的消息中间件 => 对应到本模块就是连接到 Redis 服务器

        Args:
          url(str): CecUrl
        """
        cec_url = CecUrl.parse(url)
        return self.connect_by_cec_url(cec_url)

    @logger.catch(reraise=True)
    def disconnect(self):
        """Disconnect from redis server

        断开连接 => 对应到本模块就是断开 Redis 服务器连接
        """
        if self._redis_client is None:
            return
        LoggerHelper.get_lazy_logger().debug(
            f"{self} try to disconnect from '{self._current_url}'.")
        self._redis_client.quit()
        self._redis_client = None
        LoggerHelper.get_lazy_logger().success(
            f"{self} disconnect from '{self._current_url}' successfully.")

    ####################################################################
    # 一些辅助函数
    ####################################################################

    @staticmethod
    def get_topic_consumer_group_meta_info_key(topic: str, group_id: str,
                                               key: str):
        return f"{StaticConst.REDIS_ADMIN_TOPIC_CONSUMER_GROUP_META_PREFIX}" \
               f"{topic + ':' if topic is not None else ''}" \
               f"{group_id + ':' if group_id is not None else ''}" \
               f"{key + ':' if key is not None else ''}"

    @staticmethod
    def get_topic_meta_info_key(topic: str, key: str):
        return f"{StaticConst.REDIS_ADMIN_TOPIC_META_PREFIX}" \
               f"{topic + ':' if topic is not None else ''}" \
               f"{key + ':' if key is not None else ''}"

    @staticmethod
    def get_sub_list_key(group_id: str) -> str:
        return f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_SUB_LIST_PREFIX}" \
               f"{group_id}"

    @staticmethod
    def store_meta(redis_client: Redis, key: str, value: str):
        return redis_client.set(key, value)

    @staticmethod
    def get_meta(redis_client: Redis, key: str):
        return redis_client.get(key)

    @staticmethod
    def del_meta(redis_client: Redis, prefix: str):
        next_cursor = 0
        while True:
            next_cursor, key_list = redis_client.scan(
                next_cursor,
                match=f"{prefix}*",
                count=100
            )
            if len(key_list) > 0:
                redis_client.delete(*key_list)
            if next_cursor == 0:
                break
        return True

    @staticmethod
    def store_topic_consumer_group_meta(redis_client: Redis, topic: str,
                                        key: str, group_id: str, value):
        return RedisAdmin.store_meta(
            redis_client,
            RedisAdmin.get_topic_consumer_group_meta_info_key(
                topic, group_id, key
            ),
            value
        )

    @staticmethod
    def store_topic_meta(redis_client: Redis, topic: str, key: str, value):
        """Store topic meta info

        存储主题相关的元数据信息

        Args:
            redis_client:
            topic:
            key:
            value:

        Returns:

        """
        return RedisAdmin.store_meta(
            redis_client,
            RedisAdmin.get_topic_meta_info_key(topic, key),
            value
        )

    @staticmethod
    def get_topic_consumer_group_meta(redis_client: Redis, topic: str,
                                      group_id: str, key: str):
        return RedisAdmin.get_meta(
            redis_client,
            RedisAdmin.get_topic_consumer_group_meta_info_key(
                topic, group_id, key
            )
        )

    @staticmethod
    def get_topic_meta(redis_client: Redis, topic: str, key: str):
        """Get topic meta info

        获取主题相关的元数据信息

        Args:
            redis_client:
            topic:
            key:

        Returns:

        """
        return RedisAdmin.get_meta(
            redis_client,
            RedisAdmin.get_topic_meta_info_key(topic, key)
        )

    @staticmethod
    def del_topic_consumer_group_meta(redis_client: Redis,
                                      topic: str, group_id: str):
        return RedisAdmin.del_meta(
            redis_client,
            RedisAdmin.get_topic_consumer_group_meta_info_key(
                topic, group_id, None
            )
        )

    @staticmethod
    def del_topic_meta(redis_client: Redis, topic: str):
        """Delete all meta info for specific topic

        删除特定主题的所有元数据信息

        Args:
            redis_client:
            topic:

        Returns:

        """
        res1 = RedisAdmin.del_meta(
            redis_client,
            RedisAdmin.get_topic_consumer_group_meta_info_key(topic, None,
                                                              None)
        )
        res2 = RedisAdmin.del_meta(
            redis_client,
            RedisAdmin.get_topic_meta_info_key(topic, None)
        )
        return res1 and res2

    @staticmethod
    def _lock_topic(redis_client: Redis, topic: str,
                    ignore_exception: bool = False) -> bool:
        """

        给某个主题加锁，防止并发场景下重复操作问题

        Args:
            redis_client:
            topic:
            ignore_exception:

        Returns:

        """
        # 使用set给create/del操作加锁（防止并发场景下重复创建删除问题）
        if redis_client.set(
                f"{StaticConst.REDIS_ADMIN_TOPIC_LOCKER_PREFIX}{topic}",
                topic, nx=True, ex=10) == 0:
            return raise_if_not_ignore(ignore_exception,
                                       CecException(
                                           f"Someone else is creating or"
                                           f" deleting this topic."
                                       ))
        return True

    @staticmethod
    def _unlock_topic(redis_client: Redis, topic: str) -> bool:
        """

        释放给某个主题加的锁，应当和 lock_topic 配套使用

        Args:
            redis_client:
            topic:

        Returns:

        """
        # 释放锁
        if redis_client.get(
                f"{StaticConst.REDIS_ADMIN_TOPIC_LOCKER_PREFIX}{topic}"
        ) == topic:
            return redis_client.delete(
                f"{StaticConst.REDIS_ADMIN_TOPIC_LOCKER_PREFIX}{topic}") == 1
        else:
            return False

    @staticmethod
    def _lock_consumer_group(redis_client: Redis, consumer_group_id: str,
                             ignore_exception: bool = False) -> bool:
        """

        给某个消费组加锁，防止并发场景下重复操作问题

        Args:
            redis_client:
            consumer_group_id:
            ignore_exception:

        Returns:

        """
        # 使用set给create/del操作加锁（防止并发场景下重复创建删除问题）
        if redis_client.set(
                f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX}"
                f"{consumer_group_id}",
                consumer_group_id, nx=True, ex=10) == 0:
            return raise_if_not_ignore(ignore_exception,
                                       CecException(
                                           f"Someone else is creating or"
                                           f" deleting this consumer group."
                                       ))
        return True

    @staticmethod
    def _unlock_consumer_group(redis_client: Redis,
                               consumer_group_id: str) -> bool:
        """

        释放给某个消费组加的锁，应当和 lock_consumer_group 配套使用

        Args:
            redis_client:
            consumer_group_id:

        Returns:

        """
        # 释放锁
        if redis_client.get(
                f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX}"
                f"{consumer_group_id}"
        ) == consumer_group_id:
            return redis_client.delete(
                f"{StaticConst.REDIS_ADMIN_CONSUMER_GROUP_LOCKER_PREFIX}"
                f"{consumer_group_id}") == 1
        else:
            return False

    @logger.catch()
    def __del__(self):
        self.disconnect()

    @logger.catch(reraise=True)
    def client(self):
        return self._redis_client
