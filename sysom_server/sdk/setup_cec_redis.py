import setuptools

setuptools.setup(
    name="cec_redis",
    version="0.0.1",
    author="mingfeng(SunnyQjm)",
    author_email="mfeng@linux.alibaba.com",
    description="A redis implement for common event center",
    url="",
    packages=["cec_redis"],
    install_requires=[
        "cec_base>=0.0.1",
        "atomic>=0.7.3",
        "redis>=4.3.4",
        "schedule>=1.1.0",
        "loguru>=0.6.0"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GPL License",
        "Operating System :: OS Independent",
    ]
)
