%define anolis_release 1
%define debug_package %{nil}

Name:		sysom
Version:	2.1
Release:	%{anolis_release}%{?dist}
Summary:	SysOM Server
License:	MIT
Source0:	https://gitee.com/anolis/sysom/repository/archive/v2.1/sysom-2.1.tar.gz
URL:		https://gitee.com/anolis/sysom

%description
SysOM is committed to building an automatic operation and maintenance platform
that integrates host management, configuration and deployment,
monitoring and alarm, exception diagnosis, security audit and other functions

%prep
%setup -q -n %{name}-%{version}

%build
GRAFANA_PKG=grafana-9.2.2-1.x86_64.rpm
PROMETHEUS_VER=2.29.1
PROMETHEUS_ARCH=linux-amd64
PROMETHEUS_PKG=prometheus-${PROMETHEUS_VER}.${PROMETHEUS_ARCH}
PROMETHEUS_TAR=$PROMETHEUS_PKG.tar.gz
NODE_EXPORTER_VER=1.2.2
NODE_EXPORTER_PKG=node_exporter-${NODE_EXPORTER_VER}.${PROMETHEUS_ARCH}
NODE_EXPORTER_TAR=$NODE_EXPORTER_PKG.tar.gz
MONITOR_OSS_URL=https://sysom.oss-cn-beijing.aliyuncs.com/monitor
GRAFANA_DL_URL=https://dl.grafana.com/oss/release
PROMETHEUS_DL_URL=https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VER}
NODE_DL_URL=https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VER}
REDIS_OSS_URL=https://sysom.oss-cn-beijing.aliyuncs.com/redis
REDIS_DL_URL=https://download.redis.io/releases
REDIS_PKG=redis-5.0.14.tar.gz
SYSAK_DOWNLOAD_URL=https://mirrors.openanolis.cn/sysak/packages
SYSAK_PKG=sysak-1.3.0-2.x86_64.rpm
ANCE_X86_PKG=ance-0.1.1-1.x86_64.rpm
ANCE_ARM_PKG=ance-0.1.1-1.aarch64.rpm
ANOLIS_X86_SQLITE=Anolis_OS-8.6.x86_64.sqlite
ANOLIS_ARM_SQLITE=Anolis_OS-8.6.aarch64.sqlite
ANOLIS_MIGRATION_PKGS=anolis_migration_pkgs.tar.gz

do_download_sysak() {
    echo "now download ${SYSAK_PKG}..."
    pushd script/node/diagnosis
    wget ${SYSAK_DOWNLOAD_URL}/${SYSAK_PKG}
    if [ ! -e ${SYSAK_PKG} ]
    then
        echo "download ${SYSAK_PKG} fail"
        exit 1
    fi
    popd
}

do_download_redis() {
    echo "now download ${REDIS_PKG}..."
    pushd script/server/0_local_services
    wget ${REDIS_OSS_URL}/${REDIS_PKG} || wget ${REDIS_DL_URL}/${REDIS_PKG}
    if [ ! -e ${REDIS_PKG} ]
    then
        echo "download ${REDIS_PKG} fail"
        exit 1
    fi
    popd
}

do_download_monitor() {
    echo "now download ${GRAFANA_PKG}, ${PROMETHEUS_TAR}, ${NODE_EXPORTER_TAR}..."
    mkdir -p monitor
    pushd monitor
    wget ${MONITOR_OSS_URL}/${GRAFANA_PKG} || wget ${GRAFANA_DL_URL}/${GRAFANA_PKG}
    wget ${MONITOR_OSS_URL}/${PROMETHEUS_TAR} || wget ${PROMETHEUS_DL_URL}/${PROMETHEUS_TAR}
    wget ${MONITOR_OSS_URL}/${NODE_EXPORTER_TAR} || wget ${NODE_DL_URL}/${NODE_EXPORTER_TAR}
    if [ ! -e ${GRAFANA_PKG} ]
    then
        echo "download ${GRAFANA_PKG} fail"
        exit 1
    fi
    if [ ! -e ${PROMETHEUS_TAR} ]
    then
        echo "download ${PROMETHEUS_TAR} fail"
        exit 1
    fi
    if [ ! -e ${NODE_EXPORTER_TAR} ]
    then
        echo "download ${NODE_EXPORTER_TAR} fail"
        exit 1
    fi
    popd
}

do_download_ance() {
    mkdir -p sysom_server/sysom_migration/ance
    pushd sysom_server/sysom_migration/ance
    if [ ! -f "${ANCE_X86_PKG}" ]; then
        wget "https://ance.oss-cn-hangzhou.aliyuncs.com/release/x86_64/${ANCE_X86_PKG}"
    fi
    if [ ! -f "${ANCE_ARM_PKG}" ]; then
        wget "https://ance.oss-cn-hangzhou.aliyuncs.com/release/aarch64/${ANCE_ARM_PKG}"
    fi
    if [ ! -f "${ANOLIS_X86_SQLITE}" ]; then
        wget "https://ance.oss-cn-hangzhou.aliyuncs.com/databases/${ANOLIS_X86_SQLITE}"
    fi
    if [ ! -f "${ANOLIS_ARM_SQLITE}" ]; then
        wget "https://ance.oss-cn-hangzhou.aliyuncs.com/databases/${ANOLIS_ARM_SQLITE}"
    fi
    if [ ! -f "${ANOLIS_MIGRATION_PKGS}" ]; then
        wget "https://gitee.com/src-anolis-sig/leapp/releases/download/v1.0.1-all-in-one/${ANOLIS_MIGRATION_PKGS}"
    fi
    popd
}

do_virtualenv() {
    python3 -m venv /usr/local/sysom/server/virtualenv
    source /usr/local/sysom/server/virtualenv/bin/activate
    pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/
    pip install cffi -i https://mirrors.aliyun.com/pypi/simple/
    pip install -r script/server/0_env/requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
    pushd /usr/local/sysom/server/
    tar zcf virtualenv.tar.gz virtualenv
    popd
}

do_yarn_build() {
    pushd sysom_web || exit
    yarn
    yarn build
    popd || exit
}

echo "build sysom ..........."
echo ${PWD}
#do_virtualenv
#do_download_ance
#do_download_monitor
#do_download_sysak
###you can ignore the action if the version of redis >= 5.0.0 in the deployment environment###
#do_download_redis
do_yarn_build
echo "build sysom end........"

%pre

%install
mkdir -p %{buildroot}/usr/local/sysom/server/target
#mkdir -p %{buildroot}/usr/local/sysom/server/redis
cp -a sysom_server %{buildroot}/usr/local/sysom/server/target
cp -a conf %{buildroot}/usr/local/sysom/server/target
cp -a sysom_web/dist %{buildroot}/usr/local/sysom/server/target/sysom_web
cp -a script %{buildroot}/usr/local/sysom/init_scripts
#cp -a monitor  %{buildroot}/usr/local/sysom/server/
#cp -a /usr/local/sysom/server/virtualenv.tar.gz  %{buildroot}/usr/local/sysom/server/

%files
/usr/local/sysom/

%post
#pushd /usr/local/sysom/server/
#tar -xvf virtualenv.tar.gz
#rm -rf virtualenv.tar.gz
#popd

%preun
bash -x /usr/local/sysom/init_scripts/server/clear.sh

%postun
rm -rf /usr/local/sysom

%changelog
* Fri Feb 6 2023 huangtuquan <tuquanhuang@linux.alibaba.com> - 2.1
- sysom server release 2.1
* Fri Dec 12 2022 huangtuquan <tuquanhuang@linux.alibaba.com> - 2.0
- sysom server release 2.0
