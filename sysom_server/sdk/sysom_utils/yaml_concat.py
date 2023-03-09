# -*- coding: utf-8 -*- #
"""
Time                2023/03/09 13:58
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                yaml_constructor.py
Description:
"""
from typing import Optional, Type
import yaml


class YamlConcatConstructor:
    DEFAULT_TAG_NAME = '!concat'

    def __call__(self, loader, node):
        if isinstance(node, yaml.nodes.SequenceNode):  # type: ignore
            args = loader.construct_sequence(node)
            return "".join(args)
        else:
            raise TypeError('Un-supported YAML node {!r}'.format(node))

    @classmethod
    def add_to_loader_class(
            cls,
            loader_class: Optional[Type] = None,
            tag: Optional[str] = None,
            **kwargs
    ):
        if tag is None:
            tag = ''
        tag = tag.strip()
        if not tag:
            tag = cls.DEFAULT_TAG_NAME
        if not tag.startswith('!'):
            raise ValueError('`tag` argument should start with character "!"')
        instance = cls(**kwargs)
        yaml.add_constructor(tag, instance, loader_class)
        return instance

class NodeDispatcherException(Exception):
    """Base exception for ChanneJob sdk"""