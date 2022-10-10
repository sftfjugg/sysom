# -*- coding: utf-8 -*- #
"""
Time                2022/9/25 13:07
Author:             mingfeng (SunnyQjm)
Email               mfeng@linux.alibaba.com
File                exceptions.py
Description:

This file defines the exceptions that may be thrown in the CEC
"""


class CecException(Exception):
    """CEC base exception

    This class defines the base exception for CEC, and all exceptions thrown
    by CEC should inherit from this class.
    """


class CecConnectionException(CecException):
    """An exception that may be thrown during the connection phase

    This exception should be thrown if any error occurs while a connectable
    object is connecting to the server.
    """


class CecProtoAlreadyExistsException(CecException):
    """Exceptions thrown for duplicate proto(submodule) registration

    This exception should be thrown if the proto(submodule) already exists while
    registering a submodule.
    """


class CecProtoNotExistsException(CecException):
    """Exceptions thrown for trying to use a non-existent proto(submodule)

    Exceptions that will be thrown when trying to use a non-existent proto
    (submodule).
    """


class CecNotValidCecUrlException(CecException):
    """Exception thrown when an invalid CecUrl format is parsed.

    """


class TopicAlreadyExistsException(CecException):
    """Exception for trying to add a topic that already exists

    During the creation of a Topic, this exception should be thrown if the
    current Topic already exist.
    """


class TopicNotExistsException(CecException):
    """Exception thrown when trying to manipulate a topic that does not exist

    This exception should be thrown if the target Topic does not exist during
    access, update or deletion of a Topic.
    """


class ConsumerGroupAlreadyExistsException(CecException):
    """Exception thrown when trying to add a consumer group that already exists

    During the creation of a consumer group, this exception should be thrown
    if the current consumer group already exists.
    """


class ConsumerGroupNotExistsException(CecException):
    """Exception thrown when trying to manipulate a non-existent consumer group.

    This exception should be thrown if the target consumer group does not exist
    during access, update or deletion of a consumer group.
    """
