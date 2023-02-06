#!/bin/bash -x
basedir=`dirname $0`
config=conf
env=${basedir}/../../env

for i in `cat $env`
do
    export $i
done

cd $basedir
for dir in `tac $config`
do
    if [ -d $dir ]
    then
        pushd $dir
        echo $dir
        bash -x clear.sh
        popd
    fi
done
