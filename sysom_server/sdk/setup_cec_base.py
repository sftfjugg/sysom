# -*- coding: utf-8 -*- #
"""
Author:             mingfeng (SunnyQjm)
Created:            2022/07/24
Description:
"""
import setuptools

setuptools.setup(
    name="cec_base",
    version="0.0.1",
    author="mingfeng(SunnyQjm)",
    author_email="mfeng@linux.alibaba.com",
    description="A common event center interface definition package",
    url="",
    packages=["cec_base"],
    install_requires=[
        "loguru>=0.6.0",
        "anyio>=3.6.2"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GPL License",
        "Operating System :: OS Independent",
    ]
)
