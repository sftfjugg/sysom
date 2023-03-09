#!/bin/bash

usage() {
    echo "Usage:";
	echo "./check_env.sh [OPTIONS]";
	echo "";
	echo "Options:";
	echo "  -p|--patch";
	echo "     The patch (must not null)";
	echo "  -k|--kernelversion";
	echo "     The complete kernel version include architecture (must not null)";
	echo "  -h|--help";
	echo "     For help";
	echo "";
	echo "For example:";
	echo "./kpatch-packager.sh -p \${patch} -k \${kernel} -d \"\${description}\" -v --prefix=\${prefix_patch}"; 
}

# this is to output the error msg
 warn() {
         echo "ERROR: $1" >&2
 }
 
 # First,chech the input parameter length is zero or not
 # then, check the LOGFILE exist or not , if exist, show the user that Check the LOGFILE for more details
 die() {
         if [[ -z $1 ]]; then 
                 msg="kpatch build failed"
         else
                 msg="$1"
         fi
 
         if [[ -e $LOGFILE ]]; then
                 warn "$msg. Check $LOGFILE for more details."
         else
                 warn "$msg."
         fi
 
         exit 1
 }

# info : output log to LOGFILE
 info() {
    msg=$1
    echo $1
    echo $1 >> $LOGFILE
 }

# make sure ${hotfix_base}/kpatch_space has kpatch-build
 check_kpatch_build() {
    kernel_version=$1
    cd ${BASE}
    if [[ ! -d "kpatch_space" ]]; then
        mkdir -p ${BASE}/kpatch_space
    fi
    
    cd ${BASE}/kpatch_space
    if [[ ! -d "kpatch-build" ]]; then
        info "Cloning kpatch-build ... "
        git clone https://gitee.com/anolis/kpatch-build.git

        if [[ $? -ne 0 ]]; then
            cp -a ${NFSDIR}/kpatch-build .
            if [[ $? -ne 0 ]]; then
                die "No way to get the kpatch-build..."
            fi
        fi
    else
        info "Found kpatch-build"
        cd ${BASE}/kpatch_space/kpatch-build && git pull
    fi

 }

# make sure ${hotfix_base}/kernel_repo has cloud-kernel
 check_kernel_src() {
    kernel_version=$1

    cd ${BASE}
    if [[ ! -d "kernel_repos" ]]; then
        mkdir -p ${BASE}/kernel_repos
    fi

    cd ${BASE}/kernel_repos
    if [[ ! -d "cloud-kernel" ]]; then
        info "Cloning cloud-kernel ... "
        info "When Cloning into cloud-kernel, it may take a long time ..."
        git clone https://gitee.com/anolis/cloud-kernel.git
        if [[ $? -ne 0 ]]; then
            cp -a ${NFSDIR}/cloud-kernel .
            if [[ $? -ne 0 ]]; then
                die "No way to get the kernel_source..."
            fi
        fi
    fi

    cd cloud-kernel && git fetch --tags

 }

# Check Hotfix build enviroment
options="$(getopt -o hk:b:s:n:l: -l "help,kernelversion:,hotfix_base:,ksrcs:,nfs:,log:" -- "$@")" || die "getopt failed"

eval set -- "$options"

while [[ $# -gt 0 ]]; do
	case "$1" in
	-h|--help)
		usage
		exit 0
		;;
	-k|--kernelversion)
		KERNELVERSION="$2"
		shift
		;;
    -b|--hotfix_base)
        BASE="$2"
        shift
        ;;
    -s|--ksrcs)
        KSRCS="$2"
        shift
        ;;
    -n|--nfs)
        NFSDIR="$2"
        shift
        ;;
    -l|--log)
        LOGFILE="$2"
        shift
        ;;
	esac
	shift
done

echo "checking enviroment..."
if [[ -z $LOGFILE ]]; then
    echo "Warning: No log file specify...the log may not out put to the log file!"
else
    echo "outputing log to : $LOGFILE..."
fi

if [[ -n $LOGFILE ]]; then
    info "Checking kpatch build directory..."
fi
check_kpatch_build $KERNELVERSION
if [[ -n $LOGFILE ]]; then
    info "Checking Kernel Source of Anolis..."
fi
check_kernel_src $KERNELVERSION
if [[ -n $LOGFILE ]]; then
    info "Env Check Finished ..." 
fi