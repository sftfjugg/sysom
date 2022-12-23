#!/bin/bash

check_cmd() {
    local cmd="$1"
    if ! command -v "${cmd}" >/dev/null 2>&1; then
        echo >&2 "I require ${cmd} but it's not installed. Aborting."
        exit 1
    fi
}

green() {
    printf '\33[1;32m%b\n\33[0m' "$1"
}

if [ "$UID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

basedir=`dirname $0`
pushd ${basedir}

###nodejs version should >= 16###
check_cmd yarn
check_cmd tar
check_cmd wget
check_cmd rpmbuild
check_cmd /usr/bin/python3

###rpmbuild will call brp-python-bytecompile, need /usr/bin/python
###/usr/lib/rpm/brp-python-bytecompile /usr/bin/python
###sysom run by python3, we should set /usr/bin/python link to /usr/bin/python3
mv /usr/bin/python /usr/bin/python.bak
ln -s /usr/bin/python3 /usr/bin/python

mkdir -p /root/rpmbuild/BUILD
mkdir -p /root/rpmbuild/SOURCES
mkdir -p /root/rpmbuild/BUILDROOT
mkdir -p /root/rpmbuild/SPECS
mkdir -p /root/rpmbuild/RPMS
mkdir -p /root/rpmbuild/SRPMS

cp tools/deploy/sysom-offline.spec /root/rpmbuild/SPECS
pushd ..
cp -a sysom sysom-2.0
tar -zcf sysom-2.0.tar.gz sysom-2.0
cp sysom-2.0.tar.gz /root/rpmbuild/SOURCES/
pushd /root/rpmbuild/SPECS
rpmbuild -ba sysom-offline.spec

rm -f /usr/bin/python
mv /usr/bin/python.bak /usr/bin/python
popd
popd
popd
