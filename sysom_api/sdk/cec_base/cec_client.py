# -*- coding: utf-8 -*- #
"""
Time                2022/10/11 14:38
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                cec_client.py
Description:
"""
from threading import Thread
from typing import List
from sdk.cec_base.consumer import Consumer, dispatch_consumer
from sdk.cec_base.admin import Admin, dispatch_admin
from sdk.cec_base.event import Event
from sdk.cec_base.producer import Producer, dispatch_producer


class CecClient:
    """ A client implementation for communicating with the CEC
    
    Args:
        url(str): CEC url
    """

    def __init__(self, url: str) -> None:
        self._url = url
        self._tasks: List[dict] = []
        self._consumers: List[Consumer] = []
        self._inner_threads: List[Thread]
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
            topic(str): Topic name
            group_id(str): Group ID
            consumer_id(str): Consumer ID
            
        """
        for event in consumer:
            self.on_receive_event(consumer, event, task)

    def on_receive_event(self, consumer: Consumer, event: Event, task: dict):
        """Invoke while receive event from CEC

        Args:
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
            task_thread.start()
            self._inner_threads.append(task_thread)

    def stop(self):
        for consumer in self._consumers:
            consumer.disconnect()
        self.join()

    def join(self):
        if self._inner_threads is not None:
            for _thread in self._inner_threads:
                _thread.join()
