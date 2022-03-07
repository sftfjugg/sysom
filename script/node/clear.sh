#!/bin/bash -x

basedir=`dirname $0`

cd $basedir

for i in `cat conf`
do
    export $i
done

for dir in `ls`
do
    if [ -d $dir ]
    then
        pushd $dir
        bash -x clear.sh
        popd
    fi
done
