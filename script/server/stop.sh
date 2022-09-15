#!/bin/bash -x
basedir=`dirname $0`

cd $basedir

for dir in `ls`
do
	if [ -d $dir ]
	then
		pushd $dir
		bash -x stop.sh
		popd
	fi
done
