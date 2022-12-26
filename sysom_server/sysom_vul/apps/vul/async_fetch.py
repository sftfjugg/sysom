'''
@File: async_fetch.py
@Time: 2022-12-20 14:54:18
@Author: DM
@Desc: 异步获取VUl数据
'''

import json
import asyncio
import urllib.parse
import requests
from typing import List, Dict, Union
from loguru import logger
from django.db import connection
from aiohttp import ClientSession
from asyncio import AbstractEventLoop
from aiohttp.client_exceptions import ContentTypeError

from .models import VulAddrModel


class FetchVulData:
    
    CONCURRENCY = 7

    def __init__(self,
                 loop: AbstractEventLoop = None,
                 instance: VulAddrModel = None,
                 session: ClientSession = None,
                 cve_data_path: List[str] = None,
                 total_page: int = 98
                 ) -> None:
        self.session = session
        self.loop = loop
        self._instance = instance
        self.total_page = total_page
        self._cve_data_path = cve_data_path
        self._tasks: List[asyncio.Task] = []
        self.semaphore = asyncio.Semaphore(self.CONCURRENCY)
        self._results: List[Dict] = []

    @property
    def request_session(self) -> ClientSession:
        if self.session is None:
            self.session = ClientSession()
        return self.session

    async def fetch(self, kwargs) -> Union[Dict, str]:
        """
        获取请求数据

        """
        result = None
        try:
            async with self.semaphore:
                try:
                    async with self.request_session.request(**kwargs) as response:
                        result = await response.json()
                except ContentTypeError:
                    res = await response.text()
                    result = f'被检测为Spider: {res}'
        finally:
            # await self._session_close()
            ...
        return result

    def result_callback(self, future: asyncio.Task) -> None:
        res = future.result()
        if isinstance(res, str):
            logger.error(res)
            return
        if not self._cve_data_path:
            self._results.extend(res)
        else:
            if len(self._cve_data_path) >= 1:
                for key in self._cve_data_path:
                    res = res.get(key)
                self._results.extend(res)

    async def _session_close(self):
        await self.session.close()

    async def start(self) -> None:
        for i in range(1, self.total_page+1):
            kwargs = self.make_request_params(instance=self._instance, page_num=i)
            task: asyncio.Task = self.loop.create_task(
                self.fetch(kwargs))
            task.add_done_callback(self.result_callback)
            self._tasks.append(task)

        await asyncio.gather(*self._tasks)
        await self._session_close()

    @property
    def results(self):
        return self._results

    @staticmethod
    def make_request_params(instance, page_num: int = 1) -> Dict:
        """
        结构化请求的参数

        {
            'method': instance.get_method_display(),
            'url': instance.url,
            'headers': json.loads(instance.headers),
            'data': json.loads(instance.body),
            'params': json.loads(instance.params),
            'auth': auth
        }
        """
        def _parase_query(q: str) -> Dict:
            return {item[0]: item[1] for item in [i.split('=') for i in q.split("&")]}

        kwargs = dict()
        kwargs['method'] = instance.get_method_display()
        kwargs['headers'] = json.loads(instance.headers)
        kwargs['data'] = json.loads(instance.body)
        kwargs['params'] = json.loads(instance.params)

        if instance.authorization_type.lower() == "basic":
            authorization_body = json.loads(instance.authorization_body)
            auth = (authorization_body.get('username'),
                    authorization_body.get('password'))
            kwargs['auth'] = auth

        uri: str = instance.url

        uris = uri.split('?')
        if len(uris) == 1:
            kwargs['url'] = uri
        else:
            base_url, query = uris[0], uris[1]
            query = _parase_query(query)
            query['page_num'] = page_num
            params = urllib.parse.urlencode(query=query)
            kwargs['url'] = f'{base_url}?{params}'
        return kwargs

    @classmethod
    def _get_page_total_num(cls, kwargs) -> Union[bool, int]:
        response = requests.request(**kwargs)
        if response.status_code == 200:
            result = response.json()
            return result['data']['total_page']
        else:
            return False
    
    @classmethod
    def _update_vul_data_status(cls, instance: VulAddrModel, status: int):
        try:
            instance.status = status
            instance.save()
        finally:
            connection.close()

    @classmethod
    def run(cls, instance: VulAddrModel, cve_data_path:List[str], loop=None):
        """实例化一个event loop

        @instance VulAddrModel对象 (必填参数)
        @cve_data_path 解析cve数据的结构体 []
        : loop 默认值为None, 不传递可以new_event_loop

        return []
        """
        kwargs = cls.make_request_params(instance=instance)
        page_total_num = cls._get_page_total_num(kwargs)

        if not page_total_num:
            logger.error(f'总页码数获取失败, 参数: {kwargs}')
            cls._update_vul_data_status(instance, 1)
            raise Exception('总页码数获取失败, 参数: {kwargs}')
        cls._update_vul_data_status(instance, 0)

        _loop = loop or asyncio.new_event_loop()
        asyncio.set_event_loop(_loop)
        spider = cls(
            loop=_loop,
            instance=instance,
            cve_data_path=cve_data_path,
            total_page=page_total_num
        )
        spider.loop.run_until_complete(spider.start())
        spider.loop.close()

        return spider.results
