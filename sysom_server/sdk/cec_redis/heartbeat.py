# -*- coding: utf-8 -*- #
"""
Time                2022/9/22 15:24
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                heartbeat.py
Description:
"""
import threading
from threading import Thread, Event as ThreadEvent
from typing import Optional
from collections import deque

import redis
from redis import Redis
from redis.client import PubSub
from atomic import AtomicLong
from schedule import Scheduler
from cec_base.exceptions import CecException
from cec_base.log import LoggerHelper
from .common import StaticConst
from .admin_static import static_del_consumer


class Heartbeat:
    """A daemon thread/process use to send and listen the heartbeat of consumer

    A daemon thread/process to generate and listen to the consumer's heartbeat
        1. First, the CEC creates a pub/sub channel for each consumer group.
        2. Then, when each member of the consumer group accesses the CEC, a
           Heartbeat instance is initiated that periodically sends heartbeat
           data to the "heartbeat channel" of the corresponding consumer group.
        3. Consumers also subscribe to the heartbeat channel of the consumer
           group and monitor the heartbeat data of other members of the group
           in real time.
        4. If the current consumer detects that a group member has not sent a
           heartbeat for a long time, it assumes that the member is dead and
           does the following.
        4. If the current consumer detects that a member of the group has not
           sent heartbeat data for some time, it assumes that the member is
           offline and does the following:
            - If the member does not have a pending message, move it out of the
              consumer group;
            - If the member has a pending message, it attempts to transfer the
              message to the current consumer, and moves the member out of the
              consumer group after a successful transfer.

    Args:
        redis_client(Redis): Redis client
        topic(str): Topic
        consumer_group(str): Consumer group ID
        consumer_id(str): Consumer ID

    Keyword Args
        heartbeat_interval(int): Heartbeat interval in seconds
        heartbeat_process_mod(bool): Whether to use a separate process to run
        heartbeat_check_interval(bool): Time interval to check if a consumer in
                                        a group is online

    Attributes:

    """

    # pylint: disable=too-many-instance-attributes
    # Eleven is reasonable in this case.
    def __init__(self, redis_client: Redis, topic: str, consumer_group: str,
                 consumer_id: str, **kwargs):
        self._process_mod = kwargs.get("heartbeat_process_mod", False)
        self._check_heart_beat_interval = 3
        check_interval = kwargs.get("heartbeat_check_interval", 0)
        if check_interval > 0:
            self._check_heart_beat_interval = check_interval
        self._redis_client = redis_client
        self._topic = topic
        self._consumer_group = consumer_group
        self._consumer_id = consumer_id
        self._heartbeat_interval = kwargs.get("heartbeat_interval", 5)
        self._stop_event: ThreadEvent = ThreadEvent()
        self._heartbeat_listen_thread: Optional[Thread] = None
        self._channel_name = f"{StaticConst.REDIS_HEARTBEAT_CHANNEL_PREFIX}" \
                             f"{self._topic}:{self._consumer_group}"
        self._ps: PubSub = self._redis_client.pubsub()
        self._heartbeat_timeline = AtomicLong(0)
        self._heartbeat_check_schedule = Scheduler()
        # <consumer_id> -> heartbeat timeline
        self._consumers = {

        }

        self._offline_consumers = deque()

    def _send_heart_beat(self):
        """Current send heartbeat to consumer group's heartbeat channel

        The current consumer sends a heartbeat to the heartbeat channel of the
        consumer group

        Returns:

        """
        self._heartbeat_timeline += 1
        self._redis_client.publish(self._channel_name, self._consumer_id)

    def _deal_recv_heartbeat(self, message: dict):
        """Deal received heartbeat

        Processing incoming heartbeat data

        Returns:

        """
        msg_type = message.get("type", "")
        channel, consumer = message.get('channel', ''), message.get('data', '')
        if msg_type == "message" and channel == self._channel_name and len(
                consumer) > 0:
            self._consumers[consumer] = self._heartbeat_timeline.value

    def _check_offline_consumer(self):
        """Check if there are offline consumers

        Returns:

        """
        cur, offline_consumers = self._heartbeat_timeline.value, []
        for consumer, time in self._consumers.items():
            if time + self._check_heart_beat_interval < cur:
                # Detect some consumer offline
                self._offline_consumers.append(consumer)
                offline_consumers.append(consumer)
        for consumer in offline_consumers:
            self._consumers.pop(consumer)

    def get_next_offline_consumer(self) -> Optional[str]:
        """Get next offline consumer

        Returns:

        """
        if self._offline_consumers:
            return self._offline_consumers[0]
        return None

    def remove_consumer(self, consumer: str):
        """Remove monitoring of a consumer

        Removal of monitoring of a specific consumer requires the following
        conditions to be met:
        1. Consumer offline
        2. All messages inside the PEL have been transferred;

        Args:
            consumer(str): Consumer ID

        Returns:

        """
        try:
            self._offline_consumers.remove(consumer)
            static_del_consumer(self._redis_client, self._topic,
                                self._consumer_group,
                                consumer)
        except redis.exceptions.RedisError:
            pass

    def run(self):
        """Listen and send heartbeat

        1. Periodically sends heartbeat data to the heartbeat channel of the
           consumer group;
        2. Monitor and record the heartbeat information of consumers in the
           group from the heartbeat channel of the consumer group;
        Returns:

        """
        timeout = 1 if self._heartbeat_interval >= 2 \
            else self._heartbeat_interval / 2
        try:
            while not self._stop_event.is_set():
                message = self._ps.get_message(
                    timeout=timeout)
                if message is not None:
                    self._deal_recv_heartbeat(message)
                self._heartbeat_check_schedule.run_pending()
        except redis.exceptions.ConnectionError:
            # ignore clo
            pass

    def get_consumers(self) -> dict:
        """Get consumer list

        Returns:

        """
        return self._consumers

    def start(self) -> bool:
        """Start heartbeat thread

        Returns:

        Examples:
        > XINFO CONSUMERS mystream mygroup
            1) 1) name
               2) "Alice"
               3) pending
               4) (integer) 1
               5) idle
               6) (integer) 9104628
            2) 1) name
               2) "Bob"
               3) pending
               4) (integer) 1
               5) idle
               6) (integer) 83841983

        """
        if self._heartbeat_listen_thread is not None and \
                self._heartbeat_listen_thread.is_alive():
            return False
        self._ps.subscribe(self._channel_name)
        self._heartbeat_timeline.get_and_set(0)
        self._consumers = {}

        # On startup, get a list of consumers in the group
        try:
            consumers = self._redis_client.xinfo_consumers(
                self._topic, self._consumer_group)
            for consumer in consumers:
                self._consumers[consumer.get('name', '')] = 0
        except redis.exceptions.ResponseError as error:
            LoggerHelper.get_lazy_logger().error(error)

        # Add a schedule task to send heartbeats periodically.
        self._heartbeat_check_schedule.every(self._heartbeat_interval) \
            .seconds.do(self._send_heart_beat)
        self._heartbeat_check_schedule.every(
            self._check_heart_beat_interval * self._heartbeat_interval) \
            .seconds.do(self._check_offline_consumer)

        self._heartbeat_listen_thread = threading.Thread(
            target=self.run,
            name=f"CEC-{self._consumer_group}:{self._consumer_id}-HEARTBEAT"
        )
        self._heartbeat_listen_thread.setDaemon(True)
        self._heartbeat_listen_thread.start()
        return True

    def stop(self) -> bool:
        """Stop heartbeat thread

        Returns:

        """
        try:
            if self._heartbeat_listen_thread is None:
                return False
            if not self._heartbeat_listen_thread.is_alive():
                self._heartbeat_listen_thread = None
                return False
            self._heartbeat_check_schedule.clear()
            self._stop_event.set()
            self._heartbeat_listen_thread.join()
            self._stop_event.clear()
            self._heartbeat_listen_thread = None
            self._ps.unsubscribe()
            self._ps.close()
            return True
        except (redis.RedisError, CecException):
            # Ignoring errors arising from the stop phase
            return False
