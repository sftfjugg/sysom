#!/bin/bash

green="\033[32m"
RELEASE=sysomRelease-$(date +"%Y%m%d%H%M%S")
APIDIR=sysom_api
WEBDIR=sysom_web
SCRIPTDIR=script
TOOLSDIR=tools
# build web
pushd sysom_web
yarn
yarn build
popd

mkdir -p ${RELEASE}
cp -r ${APIDIR}/ ${TOOLSDIR}/ ${RELEASE}/
cp -r ${WEBDIR}/dist/ ${RELEASE}/${WEBDIR}/
mkdir -p ${RELEASE}/${WEBDIR}/download/
cp ${TOOLSDIR}/deploy/deploy.sh  ${RELEASE}/
cp -r ${SCRIPTDIR} ${RELEASE}/
tar czf ${RELEASE}.tar.gz ${RELEASE}/
rm -rf ${RELEASE}
printf "$green The release pacakge is ${RELEASE}.tar.gz\n\033[0m"
