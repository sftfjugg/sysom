#!/bin/bash -x
main()
{
    yum erase -y `rpm -qa | grep sysak`
    exit 0
}

main
