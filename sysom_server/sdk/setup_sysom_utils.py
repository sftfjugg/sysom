# -*- coding: utf-8 -*- #
"""
Time                2023/03/09 13:58
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                setup_sysom_utils.py
Description:
"""
import setuptools

setuptools.setup(
    name="sysom_utils",
    version="0.0.1",
    author="mingfeng(SunnyQjm)",
    author_email="mfeng@linux.alibaba.com",
    description="Sysom Auxiliary Tools",
    url="",
    packages=["sysom_utils"],
    install_requires=[
        "cec_base>=0.0.1",
        "channel_job>=0.0.1",
        "loguru>=0.6.0",
        "aiohttp>=3.8.3",
        "aiofiles>=0.8.0",
        "anyio>=3.6.2"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GPL License",
        "Operating System :: OS Independent",
    ]
)
