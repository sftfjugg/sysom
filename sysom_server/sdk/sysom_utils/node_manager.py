# -*- coding: utf-8 -*- #
"""
Time                2023/03/09 13:58
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                node_dispatcher.py
Description:
"""
import aiohttp
import aiofiles
import shutil
import tarfile
import os
from asyncer import syncify
from typing import List
from channel_job.job import ChannelJobExecutor
from .config_parser import ConfigParser
from .adddict import Dict


class NodeManagerException(Exception):
    """Base exception for ChanneJob sdk"""


class NodeManager:
    def __init__(self, config: ConfigParser, channel_job_executor: ChannelJobExecutor) -> None:
        self._config = config
        self._server_config = config.get_server_config()
        self._service_config = config.get_service_config()
        self._node_config = config.get_node_config()
        self._channel_job_executor = channel_job_executor

    ##############################################################################
    # Helper functions
    ##############################################################################

    def _get_target_package_dir(self, arch: str) -> str:
        return f"{self._service_config.service_name}-{arch}"

    def _get_service_root_path(self) -> str:
        return os.path.join(
            self._server_config.path.root_path,
            self._service_config.service_dir
        )

    def _get_from_dir_path(self) -> str:
        return os.path.join(
            self._get_service_root_path(),
            self._node_config.delivery.from_dir
        )

    def _get_to_dir_path(self, arch: str) -> str:
        return os.path.join(
            self._get_service_root_path(),
            self._node_config.delivery.to_dir,
            self._get_target_package_dir(arch)
        )

    def _get_tar_package_name(self, arch: str) -> str:
        return f"{self._get_target_package_dir(arch)}.tar.gz"

    def _get_tar_package_path(self, arch) -> str:
        return os.path.join(
            self._get_service_root_path(),
            "node", "tars",
            self._get_tar_package_name(arch)
        )

    def _get_node_service_dir(self) -> str:
        return os.path.join(
            self._node_config.path.root_path,
            self._service_config.service_name
        )

    def _is_tar_exists(self, arch: str):
        """Check if the tar package for the specified architecture already exists"""
        return os.path.exists(self._get_tar_package_path(arch))

    def _get_node_envs(self, arch: str):
        envs = self._node_config.envs
        envs["ARCH"] = arch
        envs["SERVICE_NAME"] = self._service_config.service_name
        res = ""
        for env_k in envs:
            res += f"export {env_k}={envs[env_k]};"
        return res.strip()

    ##############################################################################
    # Sync APIs
    ##############################################################################

    def prepare_files(self, arch: str):
        return syncify(self.prepare_files_async, raise_sync_error=False)(
            arch=arch
        )

    def perform_init(self, arch: str, target_instance: str):
        return syncify(self.perform_init_async, raise_sync_error=False)(
            arch=arch,
            target_instance=target_instance
        )

    def perform_update(self, arch: str, target_instance: str):
        return syncify(self.perform_update_async, raise_sync_error=False)(
            arch=arch,
            target_instance=target_instance
        )

    def perform_clear(self, arch: str, target_instance: str):
        return syncify(self.perform_clear_async, raise_sync_error=False)(
            arch=arch,
            target_instance=target_instance
        )

    ##############################################################################
    # Async APIs
    ##############################################################################
    async def prepare_files_async(self, arch: str):
        async def _do_copy(file: Dict):
            src_file = os.path.join(self._get_from_dir_path(), file.local)

            # not exists, try to download from remote
            if not os.path.exists(src_file):
                if not file.remote:
                    raise NodeManagerException(
                        f"Src file not exists: {src_file}"
                        f", And could not download from: {file.remote}"
                    )
                async with aiohttp.ClientSession() as session:
                    async with session.get(file.remote) as resp:
                        async with aiofiles.open(src_file, 'wb') as fd:
                            async for chunk in resp.content.iter_chunked(1024):
                                await fd.write(chunk)

                if not os.path.exists(src_file):
                    raise NodeManagerException(
                        f"Src file not exists: {file.local}"
                        f", And could not download from: {file.remote}"
                    )

            # ensure parent dirs of dst_file exists
            to_dir_path = self._get_to_dir_path(arch)
            if not os.path.exists(to_dir_path):
                os.makedirs(to_dir_path)

            # copy to dst_file
            dst_file = os.path.join(to_dir_path, file.local)
            if os.path.exists(dst_file):
                # in case of the src and dst are the same file
                if os.path.samefile(src_file, dst_file):
                    return self
                os.remove(dst_file)

            # do copy
            shutil.copy2(src_file, dst_file)

        # 1. Check whether the specified architecture is supported.
        files = self._node_config.delivery.files[arch]
        if not files:
            raise NodeManagerException(f"Unsupported architectures: {arch}")

        # 2. Check whether the specified tar package is exists.
        if self._is_tar_exists(arch):
            return self

        # 3. Copy files
        for file in files:
            if isinstance(file, List):
                for f in file:
                    await _do_copy(f)
            else:
                await _do_copy(file)

        # 4. Compressed package
        to_dir_path = self._get_to_dir_path(arch)
        tar_path = self._get_tar_package_path(arch)
        tar_dir = os.path.dirname(tar_path)
        if not os.path.exists(tar_dir):
            os.makedirs(tar_dir)
        with tarfile.open(tar_path, "w:gz") as tar:
            tar.add(to_dir_path, arcname=self._get_target_package_dir(arch))
        return self

    async def perform_init_async(self, arch: str, target_instance: str):
        # 1. Try to dispatcher tar file to remote node
        node_service_dir = self._get_node_service_dir()
        result = await self._channel_job_executor.dispatch_file_job(
            params={
                "local_path": self._get_tar_package_path(arch),
                "remote_path": os.path.join(
                    node_service_dir,
                    self._get_tar_package_name(arch)
                ),
                "instances": [target_instance]
            }
        ).execute_async()
        if result.code != 200:
            # Dispatch file failed
            raise NodeManagerException(
                f"Dispatch file to node failed: {result.err_msg}"
            )

        # 2. Unzip tar file, execute init script
        cd_workspace = f"cd {node_service_dir}"
        unzip_cmd = f"tar -zxvf {self._get_tar_package_name(arch)}"
        cd_tar_unzip_dir = f"cd {self._get_target_package_dir(arch)}"
        init_cmd = f"bash {self._node_config.scripts.get('init', '')}"
        result = await self._channel_job_executor.dispatch_job(
            channel_opt="cmd",
            params={
                "instance": target_instance,
                "command": f"{self._get_node_envs(arch)} {cd_workspace} && {unzip_cmd} && {cd_tar_unzip_dir} &&{init_cmd}",
            },
            timeout=self._node_config.get("timeout", 60000),
            auto_retry=True
        ).execute_async()
        if result.code != 0:
            raise NodeManagerException(
                f"Execute init script failed: {result.err_msg}"
            )
        return self

    async def perform_update_async(self, arch: str, target_instance: str):
        return await self.perform_init_async(arch, target_instance)

    async def perform_clear_async(self, arch: str, target_instance: str):
        node_service_dir = os.path.join(
            self._get_node_service_dir(),
            self._get_target_package_dir(arch)
        )
        cd_workspace = f"cd {node_service_dir}"
        clear_cmd = f"bash {self._node_config.scripts.get('clear', '')}"
        result = await self._channel_job_executor.dispatch_job(
            channel_opt="cmd",
            params={
                "instance": target_instance,
                "command": f"{self._get_node_envs(arch)} {cd_workspace} && {clear_cmd}",
            },
            timeout=self._node_config.get("timeout", 60000),
            auto_retry=True
        ).execute_async()
        if result.code != 0:
            raise NodeManagerException(
                f"Execute clear script failed: {result.err_msg}"
            )
        return self
