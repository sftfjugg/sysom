# -*- coding: utf-8 -*- #
"""
Time                2022/7/25 14:48
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                redis_admin.py
Description:
"""
from ..cec_base.admin import Admin
from ..cec_base.admin import TopicNotExistsException, TopicAlreadyExistsException
from ..cec_base.admin import ConsumerGroupNotExistsException
from ..cec_base.admin import ConsumerGroupAlreadyExistsException
from ..cec_base.base import raise_if_not_ignore
from ..cec_base.meta import TopicMeta
from ..cec_base.log import LoggerHelper
from ..cec_base.url import CecUrl
from redis import Redis
from redis.exceptions import ResponseError
from .utils import do_connect_by_cec_url
from loguru import logger


class RedisAdmin(Admin):
    """A redis-based execution module implement of Admin

    一个基于 Redis 实现的执行模块中的 Admin 实现

    """
    # 指示一个集合 => 保存了所有的 Stream 的key
    _REDIS_ADMIN_TOPIC_LIST_SET = "ali-cec-redis-admin-topic-list-set"

    # 指示一个集合 => 保存了所有的 Consumer Group 的key
    _REDIS_ADMIN_CONSUMER_GROUP_LIST_SET \
        = "ali-cec-redis-admin-consumer-group-list-set"

    # 指定一个特殊的前缀 => 拼接上 Topic 的名字，用于存储该 Topic 的元数据（meta）信息
    _REDIS_ADMIN_TOPIC_META_KEY_PREFIX \
        = "ali-cec-redis-admin-topic-meta-key-prefix"

    def __init__(self, url: CecUrl):
        self._redis_client: Redis = None
        self._current_url: str = ""
        self.connect_by_cec_url(url)

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
        # 使用set给create/del操作加锁（防止并发场景下重复创建删除问题）
        if redis_client.set(
                f"{topic_name}_ali-ece-redis-create-and-del-topic",
                1, nx=True, ex=10) == 0:
            return raise_if_not_ignore(ignore_exception,
                                       TopicAlreadyExistsException(
                                           f"Someone else is creating or"
                                           f" deleting this topic."
                                       ))
        # 1. 判断 Topic 是否存在
        if RedisAdmin.static_is_topic_exist(redis_client, topic_name):
            return raise_if_not_ignore(ignore_exception,
                                       TopicAlreadyExistsException(
                                           f"Topic {topic_name} already "
                                           f"exists."
                                       ))
        # 2. 使用 xadd 触发 stream 创建
        event_id = redis_client.xadd(topic_name, {
            "test": 1
        })

        # 3. 删除刚才添加的测试事件，清空 stream
        redis_client.xdel(topic_name, event_id)

        # 4. 将新建的 Topic 加入到 Topic 集合当中（便于获取所有 Topic 列表）
        redis_client.sadd(RedisAdmin._REDIS_ADMIN_TOPIC_LIST_SET,
                          topic_name)

        # 5. 构造并保存元数据信息
        redis_client.hset(
            f"{RedisAdmin._REDIS_ADMIN_TOPIC_META_KEY_PREFIX}-{topic_name}",
            mapping={
                "topic_name": topic_name,
                "num_partitions": num_partitions,
                "replication_factor": replication_factor,
                "expire_time": expire_time
            }
        )
        # 释放锁
        redis_client.delete(
            f"{topic_name}_ali-ece-redis-create-and-del-topic")
        LoggerHelper.get_lazy_logger().success(
            f"{redis_client} create_topic '{topic_name}' successfully.")
        return True

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
            5. 构造并保存元数据信息
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

        Examples:
            >>> admin = dispatch_admin("redis://localhost:6379")
            >>> admin.create_topic("test_topic")
            True
        """
        return RedisAdmin.static_create_topic(self._redis_client, topic_name,
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

        # 使用set给create/del操作加锁（防止并发场景下重复创建删除问题）
        if redis_client.set(
                f"{topic_name}_ali-ece-redis-create-and-del-topic",
                1, nx=True, ex=10) == 0:
            raise_if_not_ignore(ignore_exception,
                                TopicNotExistsException(
                                    f"Someone else is creating or deleting "
                                    f"this topic."
                                ))
        # 1. 判断是否存在
        if not RedisAdmin.static_is_topic_exist(redis_client, topic_name):
            raise_if_not_ignore(ignore_exception, TopicNotExistsException(
                f"Topic {topic_name} not exists."
            ))
        # 2. 删除对应的 stream（topic）
        redis_client.delete(topic_name)

        # 3. 将当前 topic 从 topic 列表中移除
        redis_client.srem(RedisAdmin._REDIS_ADMIN_TOPIC_LIST_SET, topic_name)

        # 4. 删除 topic 的元数据信息
        redis_client.delete(
            f"{RedisAdmin._REDIS_ADMIN_TOPIC_META_KEY_PREFIX}-{topic_name}")
        # 释放锁
        redis_client.delete(
            f"{topic_name}_ali-ece-redis-create-and-del-topic")

        LoggerHelper.get_lazy_logger().success(
            f"{redis_client} del_topic '{topic_name}' successfully.")
        return True

    @logger.catch(reraise=True)
    def del_topic(self, topic_name: str,
                  ignore_exception: bool = False) -> bool:
        """Delete one topic

        删除一个 Topic => 对应到 Redis 应该是删除一个 Stream
            1. 直接删除 Stream 对应的key即可

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
    def static_is_topic_exist(redis_client: Redis, topic_name: str) -> bool:
        res = redis_client.type(topic_name) == 'stream'
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
        return RedisAdmin.static_is_topic_exist(self._redis_client, topic_name)

    @staticmethod
    @logger.catch(reraise=True)
    def static_get_topic_list(redis_client: Redis) -> [str]:
        res = [topic_name for topic_name in
               redis_client.smembers(RedisAdmin._REDIS_ADMIN_TOPIC_LIST_SET)]
        LoggerHelper.get_lazy_logger().debug(
            f"get_topic_list => {res}.")
        return res

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
    def get_meta_info(client: Redis, topic_name: str) -> TopicMeta:
        """Get topic's meta info

        获取特定 Topic 的元数据信息

        Args:
          client(Redis): Redis client
          topic_name(str): topic name

        Returns:
            TopicMeta: the topic meta info object
        """
        values = client.hgetall(
            f"{RedisAdmin._REDIS_ADMIN_TOPIC_META_KEY_PREFIX}-{topic_name}")
        LoggerHelper.get_lazy_logger().debug(
            f"get_meta_info => {values}.")
        return TopicMeta(**values)

    @staticmethod
    @logger.catch(reraise=True)
    def static_create_consumer_group(redis_client: Redis,
                                     consumer_group_id: str,
                                     ignore_exception: bool = False) -> bool:
        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} try to create_consumer_group "
            f"<consumer_group_id={consumer_group_id}>.")

        # 使用set给create/del操作加锁（防止并发场景下重复创建删除问题）
        if redis_client.set(
                f"{consumer_group_id}_ali-ece-redis-create-and-del-consumer-"
                f"group-id",
                1, nx=True, ex=10) == 0:
            raise_if_not_ignore(ignore_exception,
                                ConsumerGroupAlreadyExistsException(
                                    f"Someone else is creating or deleting "
                                    f"this consumer group."
                                ))
        if RedisAdmin.static_is_consumer_group_exist(redis_client,
                                                     consumer_group_id):
            if ignore_exception:
                return False
            else:
                raise ConsumerGroupAlreadyExistsException(
                    f"Consumer group {consumer_group_id} already exists.")
        # 添加到消费组key集合当中
        redis_client.sadd(RedisAdmin._REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
                          consumer_group_id)

        # 释放锁
        redis_client.delete(
            f"{consumer_group_id}_ali-ece-redis-create-and-del-consumer-"
            f"group-id")
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
    def static_del_consumer_group(redis_client: Redis, consumer_group_id: str,
                                  ignore_exception: bool = False) -> bool:
        LoggerHelper.get_lazy_logger().debug(
            f"{redis_client} try to del_consumer_group "
            f"<consumer_group_id={consumer_group_id}>.")

        # 使用set给create/del操作加锁（防止并发场景下重复创建删除问题）
        if redis_client.set(
                f"{consumer_group_id}_ali-ece-redis-create-and-del-consumer-"
                f"group-id",
                1, nx=True, ex=10) == 0:
            raise_if_not_ignore(ignore_exception,
                                ConsumerGroupNotExistsException(
                                    f"Someone else is creating or deleting "
                                    f"this consumer group."
                                ))
        # 1. 首先判断消费组是否存在，不存在则根据情况抛出异常
        if not RedisAdmin.static_is_consumer_group_exist(redis_client,
                                                         consumer_group_id):
            raise_if_not_ignore(ignore_exception,
                                ConsumerGroupNotExistsException(
                                    f"Consumer group {consumer_group_id} "
                                    f"not exists."
                                ))

        # 2. 从消费组集合中移除
        redis_client.srem(RedisAdmin._REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
                          consumer_group_id)

        # 3. 销毁当前消费组关联的所有stream中的同名消费组结构
        stream = redis_client.lpop(
            f"{consumer_group_id}__ali-cec-redis-consumer-group-list")
        while stream is not None:
            # 如果主题没有被删除，则将消费组从中移出，否则什么都不做，只是pop
            if RedisAdmin.static_is_topic_exist(redis_client, stream):
                redis_client.xgroup_destroy(stream, consumer_group_id)
            stream = redis_client.lpop(
                f"{consumer_group_id}__ali-cec-redis-consumer-group-list")

        # 释放锁
        redis_client.delete(
            f"{consumer_group_id}_ali-ece-redis-create-and-del-consumer-"
            f"group-id")

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
            RedisAdmin._REDIS_ADMIN_CONSUMER_GROUP_LIST_SET,
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
        return RedisAdmin.static_is_consumer_group_exist(self._redis_client,
                                                         consumer_group_id)

    @staticmethod
    @logger.catch(reraise=True)
    def static_get_consumer_group_list(redis_client: Redis) -> [str]:
        res = [topic_name for topic_name in
               redis_client.smembers(
                   RedisAdmin._REDIS_ADMIN_CONSUMER_GROUP_LIST_SET)]
        LoggerHelper.get_lazy_logger().debug(
            f"get_consumer_group_list => {res}.")
        return res

    @logger.catch(reraise=True)
    def get_consumer_group_list(self) -> [str]:
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
        return RedisAdmin.static_get_consumer_group_list(self._redis_client)

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
        try:
            LoggerHelper.get_lazy_logger().debug(
                f"try to add consumer group '{consumer_group_id}"
                f"' to topic '{stream}'.")
            redis_client.xgroup_create(stream, consumer_group_id, id="0-0")
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
                f"{consumer_group_id}__ali-cec-redis-consumer-group-list",
                stream
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

    @logger.catch()
    def __del__(self):
        self.disconnect()

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

    @logger.catch(reraise=True)
    def client(self):
        return self._redis_client

    @staticmethod
    @logger.catch(reraise=True)
    def perform_periodic_cleanup(redis_client: Redis,
                                 topic_name: str,
                                 expire_duration: int = 0):
        # 先获取到当前最新的时间
        time_res = redis_client.time()
        time_ms = int(time_res[0] * 1000 + time_res[1] / 1000)

        # 然后执行 xtrim 命令进行清理
        clean_count = redis_client.xtrim(topic_name,
                                         minid=f"{time_ms - expire_duration}")
        LoggerHelper.get_lazy_logger().debug(
            f"perform_periodic_cleanup => {clean_count}"
        )
        return clean_count
