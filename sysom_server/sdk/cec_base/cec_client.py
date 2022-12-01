# -*- coding: utf-8 -*- #
"""
Time                2022/10/11 14:38
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                cec_client.py
Description:
"""
import asyncio
import time
from threading import Thread
from typing import Any, Optional, Dict, Callable, List
from queue import Queue
from cec_base.event import Event
from cec_base.consumer import Consumer, dispatch_consumer
from cec_base.producer import Producer, dispatch_producer
from cec_base.admin import Admin, dispatch_admin
from cec_base.utils import StoppableThread
from cec_base.exceptions import CecException


class CecConsumeTaskException(CecException):
    """
    An exception that may be thrown in the process of performing consume task
    """

    def __init__(self, task_id: str, msg: str):
        super().__init__(f"{task_id}: {msg}")
        self.task_id = task_id


class CecAsyncConsumeTask:
    """A helper class for performing consume tasks"""

    def __init__(self, url: str, topic_name: str, group_id: str,
                 consumer_id: str):
        self._consumer = dispatch_consumer(url, topic_name, consumer_id,
                                           group_id)
        self._topic_name = topic_name
        self._group_id = group_id
        self._consumer_id = consumer_id
        self._task_id = f"{topic_name}-{group_id}-{consumer_id}"

    @property
    def topic_name(self):
        """ Get topic_name """
        return self._topic_name

    @property
    def group_id(self):
        """ Get group id """
        return self._group_id

    @property
    def consumer_id(self):
        """ Get consumer id """
        return self._group_id

    @property
    def task_id(self):
        """ Get task id """
        return self._task_id

    @property
    def consumer(self):
        """ Get consumer """
        return self._consumer

    def ack(self, event: Event):
        """ Ack event """
        self._consumer.ack(event)

    async def get_next(self, max_count: int = 10):
        """Get next event"""
        try:
            res = await self._consumer.consume_async(
                batch_consume_limit=max_count
            )
            return res, self.task_id
        except Exception as exc:
            raise CecConsumeTaskException(self._task_id, str(exc)) from exc

    def stop(self):
        """Stop consume task"""
        self._consumer.disconnect()


class MultiConsumer:
    """A strengthened consumer can consume content from multiple themes
    at the same time.

    Args:
        url(str): CEC url
        sync_mode(bool): This parameter specifies whether CecClient uses
                         synchronous mode
            1. sync mode: In synchronous mode, all received events will
               be placed inside a FIFO queue, which is fetched via the
               get_next_event interface;
            2. callback mode: In callback mode, CecClient will call the
               on_receive_event callback every time it receives an event.
        custom_callback(Any): Custom callbacks for handling events

    Keyword Args:
        recover_interval(int): Recover wait time after some exception raised (s)
        max_recover_try_times(int): Maximum number of recovery attempts
    """

    def __init__(self, url: str, sync_mode: bool = False,
                 custom_callback: Callable[
                     [Event, CecAsyncConsumeTask], None] = None,
                 **kwargs):
        self._url = url
        self._consume_tasks: Dict[str, CecAsyncConsumeTask] = {}
        self._sync_mode = sync_mode
        self._inner_queue: Optional[Queue] = None
        if self._sync_mode:
            self._inner_queue = Queue(maxsize=10)
        self._custom_callback = custom_callback
        self._admin: Admin = dispatch_admin(url)
        self._inner_thread: Optional[StoppableThread] = None
        self._recover_interval = kwargs.get("recover_interval", 5)
        self._max_recover_try_times = kwargs.get("max_recover_try_times", 1000)
        self._current_retry_times = 0

    def _ensure_topic_exists(self, topic: str):
        """A func used to ensure a specific topic exist

        Determine whether the topic exists and create it if it does not

        Args:
            topic(str): Topic Name
        """
        if not self._admin.is_topic_exist(topic):
            self._admin.create_topic(topic)

    def _fetch_event(self):
        loop = asyncio.new_event_loop()
        tasks = [item.get_next() for item in self._consume_tasks.values()]
        while not self._inner_thread.stopped():
            finished, unfinished = loop.run_until_complete(
                asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            )
            tasks = list(unfinished)
            for task in finished:
                if task.exception() is not None:
                    # if some exception occur
                    if self._current_retry_times < self._max_recover_try_times:
                        self._current_retry_times = self._current_retry_times \
                            + 1
                    else:
                        raise task.exception()
                    time.sleep(self._recover_interval)
                    tasks.append(
                        self._consume_tasks[
                            task.exception().task_id].get_next()
                    )
                else:
                    self._current_retry_times = 0
                    events, task_id = task.result()
                    consume_task = self._consume_tasks.get(task_id, None)
                    # process result
                    for event in events:
                        if self._sync_mode:
                            self._inner_queue.put({
                                "event": event,
                                "task": consume_task
                            })
                        elif self._custom_callback is not None:
                            self._custom_callback(event, consume_task)
                    tasks.append(
                        self._consume_tasks[task_id].get_next()
                    )

    def append_group_consume_task(self, topic_name: str, group_id: str,
                                  consumer_id: str = None, **kwargs):
        """Append a group consume task to CecClient
        Args:
            topic_name(str): Topic name
            group_id(str): Group ID
            consumer_id(str): Consumer ID
        Keyword Args:
            ensure_topic_exist(bool): Whether ensure target topic exists
        """
        # Ensure consumer id
        if consumer_id is None:
            consumer_id = Consumer.generate_consumer_id()
        # Ensure topic
        if kwargs.get('ensure_topic_exist', False):
            self._ensure_topic_exists(topic_name)
        consume_task = CecAsyncConsumeTask(self._url, topic_name, group_id,
                                           consumer_id)
        if consume_task.task_id in self._consume_tasks:
            raise CecException(
                f"Task already exists (topic_name={topic_name}, "
                f"group_id={group_id}, "
                f"consumer_id={consumer_id})")
        self._consume_tasks[consume_task.task_id] = consume_task

    def start(self):
        """Start consume task"""
        if self._inner_thread is not None \
                and not self._inner_thread.stopped() \
                and self._inner_thread.is_alive():
            return
        self._inner_thread = StoppableThread(target=self._fetch_event)
        self._inner_thread.setDaemon(True)
        self._inner_thread.start()

    def stop(self):
        """Stop consume task"""
        if self._inner_thread is not None \
                and not self._inner_thread.stopped():
            self._inner_thread.stop()

    def join(self, timeout: Optional[int] = None):
        """Wait until all consume task stop"""
        if self._inner_thread is not None \
                and not self._inner_thread.stopped() \
                and self._inner_thread.is_alive():
            self._inner_thread.join(timeout)


class CecClient:
    """ A client implementation for communicating with the CEC

    Args:
        url(str): CEC url
        sync_mode(bool): This parameter specifies whether CecClient uses
                         synchronous mode
            1. sync mode: In synchronous mode, all received events will
               be placed inside a FIFO queue, which is fetched via the
               get_next_event interface;
            2. callback mode: In callback mode, CecClient will call the
               on_receive_event callback every time it receives an event.

    """

    def __init__(self, url: str, sync_mode: bool = False,
                 custom_callback: Any = None) -> None:
        self._url = url
        self._tasks: List[dict] = []
        self._consumers: List[Consumer] = []
        self._inner_threads: List[Thread]
        self._sync_mode = sync_mode
        self._inner_queue = None
        self._custom_callback = custom_callback
        if self._sync_mode:
            self._inner_queue = Queue(maxsize=10)
        self.admin: Admin = dispatch_admin(url)
        self.producer: Producer = dispatch_producer(url)

    def _ensure_topic_exists(self, topic: str):
        """A func used to ensure a specific topic exist

        Determine whether the topic exists and create it if it does not

        Args:
            topic(str): Topic Name
        """
        if not self.admin.is_topic_exist(topic):
            self.admin.create_topic(topic)

    def _do_group_consume_task(self, consumer: Consumer, task: dict):
        """A runable func to do group consume task

        Args:
            consumer(Consumer): CEC Consumer instance
            task: Consume task
        """
        for event in consumer:
            if self._sync_mode:
                self._inner_queue.put({
                    "event": event,
                    "task": task,
                    "consumer": consumer
                })
            elif self._custom_callback is not None:
                self._custom_callback(consumer, self.producer, event, task)
            else:
                self.on_receive_event(consumer, self.producer, event, task)

    def get_next_event(self) -> dict:
        """Get next event"""
        if not self._sync_mode:
            raise Exception("Not in sync mode")
        return self._inner_queue.get()

    def on_receive_event(self, consumer: Consumer, producer: Producer,
                         event: Event,
                         task: dict):
        """Invoke while receive event from CEC

        Args:
            consumer(Consumer): Cec Consumer instance
            event(Event): CEC Event
            task: Consume task
            {
                "topic_name": xxx,
                "group_id": xxx,
                "consumer_id": xxx
            }
        """
        raise NotImplementedError

    def append_group_consume_task(self, topic_name: str, group_id: str,
                                  consumer_id: str = None, **kwargs):
        """Append a group consume task to CecClient
        Args:
            topic_name(str): Topic name
            group_id(str): Group ID
            consumer_id(str): Consumer ID
        Keyword Args:
            ensure_topic_exist(bool): Whether ensure target topic exists
        """
        # Ensure consumer id
        if consumer_id is None:
            consumer_id = Consumer.generate_consumer_id()
        # Ensure topic
        if kwargs.get('ensure_topic_exist', False):
            self._ensure_topic_exists(topic_name)
        self._tasks.append({
            "topic_name": topic_name,
            "group_id": group_id,
            "consumer_id": consumer_id,
            **kwargs
        })

    def delivery(self, topic: str, value: dict):
        """Generate an event delivered to the specified topic
        Args:
            topic(str): Topic name
            value(str): Event value
        """
        self.producer.produce(topic, value)
        self.producer.flush()

    def start(self):
        self._consumers = []
        self._inner_threads = []
        for task in self._tasks:
            # Create a consumer
            consumer: Consumer = dispatch_consumer(
                self._url, **task
            )
            self._consumers.append(consumer)
            # Perform consume tasks inside a separate thread
            task_thread = Thread(target=self._do_group_consume_task, args=(
                consumer, task))
            task_thread.setDaemon(True)
            task_thread.start()
            self._inner_threads.append(task_thread)

    def stop(self, *args, **kwargs):
        for consumer in self._consumers:
            consumer.disconnect()
        self.join()

    def join(self):
        if self._inner_threads is not None:
            for _thread in self._inner_threads:
                _thread.join()
