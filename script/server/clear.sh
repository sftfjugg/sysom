#!/bin/bash -x
basedir=`dirname $0`

cd $basedir

for dir in `ls -r`
do
	if [ -d $dir ]
	then
		pushd $dir
		bash -x clear.sh
		popd
	fi
done
