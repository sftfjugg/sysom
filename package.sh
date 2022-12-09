#!/bin/bash
OSS_URL=https://sysom.oss-cn-beijing.aliyuncs.com/redis
REDIS_DL_URL=https://download.redis.io/releases
RELEASE=sysomRelease-$(date +"%Y%m%d%H%M%S")
RELEASE_TARGET=${RELEASE}/server/target
RELEASE_REDIS=${RELEASE}/server/redis
SERVERDIR=sysom_server
WEBDIR=sysom_web
SCRIPTDIR=script
TOOLSDIR=tools
REDIS_DIR=redis-5.0.14
REDIS_PKG=redis-5.0.14.tar.gz

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

###you can ignore the action if the version of redis >= 5.0.0 in the deployment environment###
compile_redis() {
    wget ${OSS_URL}/${REDIS_PKG} || wget ${REDIS_DL_URL}/${REDIS_PKG}
    if [ ! -e ${REDIS_PKG} ]
    then
        echo "download ${REDIS_PKG} fail"
        exit 1
    fi
    tar -zxvf ${REDIS_PKG}
    pushd ${REDIS_DIR}
    make || exit 1
    popd
    mkdir -p ${RELEASE_REDIS}
    cp ${REDIS_DIR}/redis.conf ${RELEASE_REDIS}/
    cp ${REDIS_DIR}/src/redis-server ${RELEASE_REDIS}/
    rm -rf ${REDIS_DIR} ${REDIS_PKG}
}

compile_sysom() {

    check_cmd yarn
    check_cmd tar

    # build web
    pushd sysom_web || exit
    yarn
    yarn build
    popd || exit

    ###you can ignore the action if the version of redis >= 5.0.0 in the deployment environment###
    compile_redis

    mkdir -p ${RELEASE_TARGET}
    cp -r ${SERVERDIR}/ "${RELEASE_TARGET}"/
    cp -r ${TOOLSDIR}/ "${RELEASE}"/
    cp -r ${WEBDIR}/dist/ "${RELEASE_TARGET}"/${WEBDIR}/
    mkdir -p "${RELEASE_TARGET}"/${WEBDIR}/download/
    cp ${TOOLSDIR}/deploy/deploy.sh "${RELEASE}"/
    cp ${TOOLSDIR}/deploy/clear.sh "${RELEASE}"/
    cp -r ${SCRIPTDIR} "${RELEASE}"/
    tar czf "${RELEASE}".tar.gz "${RELEASE}"/
    rm -rf "${RELEASE}"
    green "The release pacakge is ${RELEASE}.tar.gz"
}
compile_sysom
