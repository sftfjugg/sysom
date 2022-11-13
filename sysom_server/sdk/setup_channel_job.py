import setuptools

setuptools.setup(
    name="channel_job",
    version="0.0.1",
    author="mingfeng(SunnyQjm)",
    author_email="mfeng@linux.alibaba.com",
    description="Used to implement synchronous asynchronous communication with the Channel module",
    url="",
    packages=["channel_job"],
    install_requires=[
        "cec_base>=0.0.1",
        "cec_redis>=0.0.1",
        "loguru>=0.6.0",
        "anyio>=3.6.2",
        "requests"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GPL License",
        "Operating System :: OS Independent",
    ]
)
