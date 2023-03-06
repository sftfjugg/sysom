# -*- coding: utf-8 -*- #
"""
Time                2022/11/14 14:32
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                file.py
Description:
"""
from fastapi import APIRouter, File, UploadFile, Form
from conf.settings import *
import aiofiles
import asyncio
from lib.ssh import AsyncSSH
from app.schemas import RequestParamGetFileFromNode
from starlette.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask


router = APIRouter()

CHANNEL_PORT = os.getenv("CHANNEL_PORT", 7003)


@router.post("/send")
async def send_file_to_node(
    file: UploadFile = File(..., description="Files that need to be distributed to nodes"),
    target_instances: str = Form(...),
    target_path: str = Form(...),
):
    async with aiofiles.tempfile.TemporaryDirectory(dir=TMP_DOWNLOAD_DIR) as path:
        async with aiofiles.tempfile.NamedTemporaryFile(
            delete=False, dir=path
        ) as tmp_file:
            # 1. Save uploaded file as a tmp file
            await tmp_file.write(await file.read())
            await tmp_file.flush()

            # 2. Initiate N job to pull uploaded files
            tasks = []
            instances = target_instances.split(";")
            for instance in instances:
                tasks.append(AsyncSSH(instance).send_file_to_remote_async(
                    tmp_file.name,
                    target_path
                ))

            # 3. Wait all scp task finish
            scp_result = await asyncio.gather(*tasks)

            # 4. Return result
            result = {
                "code": 0,
                "err_msg": "",
                "result": []
            }
            for i in range(len(instances)):
                if scp_result[i] is not None:
                    result["code"] = 1
                    result["err_msg"] = f"{result['err_msg']}, {str(scp_result[i])}"
                result["result"].append({
                    "instance": instances[i],
                    "success": scp_result[i] is None,
                    "err_msg": str(scp_result[i]) if scp_result[i] is not None else ""
                })
            return result


@router.get("/get")
async def get_file_from_node(
    param: RequestParamGetFileFromNode
):
    async with aiofiles.tempfile.NamedTemporaryFile(dir=TMP_DOWNLOAD_DIR, delete=False) as tmp_file:
        err = await AsyncSSH(param.target_instance).get_file_from_remote_async(tmp_file.name, param.remote_path)
        tmp_file.flush()
        if err is None:
            return FileResponse(
                tmp_file.name,
                filename=os.path.basename(param.remote_path),
                background=BackgroundTask(lambda: os.remove(tmp_file.name))
            )
        else:
            return JSONResponse(
                status_code=404,
                content=str(err),
                background=BackgroundTask(lambda: os.remove(tmp_file.name))
            )
