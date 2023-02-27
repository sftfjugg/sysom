# author: ydjohn <ydzhang@linux.alibaba.com>
# This script is used to build a hotfix, which is an component of sysom
SRCPREFIX="/tmp/src"
tmpdir="/hotfix_tmpdir"
CHANGEINFOFILE=${tmpdir}/changeinfo
LOCAL_NFS_HOME=/usr/local/sysom/server/builder/hotfix
# The following location is connected with builder.py
NFS_RPM_DIR="${LOCAL_NFS_HOME}/rpm"
HOTFIX_PACKAGE_REPO="/hotfix/packages"

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

warn() {
         echo "ERROR: $1" >&2
}

usage() {
	echo "usage: build_hotfix.sh [options] <parameters>" >&2
	echo "		-h, --help              Show this help message" >&2
	echo "		-p, --patch       		Specify the patch to build hotfix" >&2
	echo "		-k, --kernel         	Specify kernel version (including arch)" >&2
	echo "		-d, --description       Specify hotfix description " >&2
	echo "		-b, --base	            Specify hotfix build work space" >&2
	echo "		-v, --vmlinux           Specify original vmlinux" >&2
	echo "		-n, --name              Specify name of hotfix" >&2
	echo "		-g, --log	            Specify the log file" >&2
	echo "		-c, --config            Specify kernel config file" >&2
	echo "		-r, --repo              Specify the kernel source directory" >&2
	echo "		-t, --tag       		Specify the tag of the source code if it is a git repo" >&2
	echo "		--kpatch-module   		Config to use kpatch.ko module mode instead of livepatch" >&2
	echo "		--kernel-devel   		Config the kernel-devel package path" >&2
}

function parse_args(){
	ARGS=`getopt -l patch:,kernel:,base:,description:,vmlinux:,help,name:,log:,config:,repo:,tag:,kpatch-module,kernel-devel -o hv:p:k:d:n:b:g:c:r:t:  -- "$@" 2>/dev/null` || { usage; die "Usage parameter mismatch";}
	eval set -- "${ARGS}"
	while [ -n "$1" ]
	do
		case "$1" in
		-p|--patch)
			patch=$(readlink -f "$2")
			shift
			;;
		-k|--kernel)
			kernel="$2"
			shift
			;;
		-d|--description)
			description="$2"
			shift
			;;
        -b|--base)
            BASE_ROOT="$2"
            shift
            ;;
		-v|--vmlinux)
			VMLINUX="$2"		
			shift
			;;
		-n|--name)
			hotfix_name="$2"
			shift
			;;
		-g|--log)
			LOGFILE="$2"
			shift
			;;
		-h|--help)
			usage
			;;
		-c|--config)
			CONFIGFILE="$2"
			shift
			;;
		-r|--repo)
			SRCREPO="$2"
			shift
			;;
		-t|--tag)
			tag="$2"
			shift
			;;
		--kpatch-module)
			USE_KPATCH_MODULE=1
			;;
		--kernel-devel)
			DEV_PACKAGE="$2"
			shift
			;;
		--)
			echo bb
			shift
			break
			;;
		esac
		shift
	done

	echo "Using Source repo name => ${SRCREPO}"

	if [[ $USE_KPATCH_MODULE -eq 1 ]]; then
		echo "USE KPATCHMODULE"
	else
		USE_KPATCH_MODULE=0
	fi

	if [ -z ${patch} ]; then
		usage;
		die "not patch input";
	fi
	
	if [ -z ${kernel} ]; then
		usage;
		die "No kernel version input";
	fi

	if [ -z "${description}" ]; then
		usage;
		die "No description input";
	fi

    if [ -z "${hotfix_name}" ]; then
        kpatch_id="`date "+%Y-%m-%d-%H-%M-%S"`"
    fi

    BASE=${BASE_ROOT}/kpatch_space
	KSRCS=${BASE_ROOT}/kernel_repos

	kernel_version="${kernel}"
	strtmp=${kernel_version}

	# $arch is like "x86_64" or "aarch64"
	arch="${strtmp##*.}"
	if [ "$arch" != "x86_64" -a "$arch" != "aarch64" ]; then
		echo "please input complete kernel version including arch (x86_64 or aarch64)"
		die "Arch is incomplete in kernel version"
	fi

	# 4.19.91-26.an7.x86_64 => 4.19.91-26.an7
	strtmp="${strtmp%.*}"

	if [[ -z $tag ]]; then
	    tag="${strtmp%.*}"
	fi
	# $dist is like 'an8' or 'an7'
	dist="${strtmp##*.}"
	#release="${strtmp#*-}"

	release="${kernel_version#*-}"
	localversion="-${release}"
	echo "localversion : ${localversion}"
	export LOCALVERSION="${localversion}"

	kpatch_id=`date "+%Y%m%d%H%M%S"`
	if [[ -n "$hotfix_name" ]]; then
		echo "find hotfix_name : ${hotfix_name}"
		kpatch_id=${hotfix_name}-${tag}-${kpatch_id}
	else
		kpatch_id=${patch_name}-${tag}-${kpatch_id}
	fi
	echo ${kpatch_id}
}

function download_config() {
    local get=0
    for ver in ${os_version}
    do
        for i in ${os_type}
        do  
            uri="https://mirrors.openanolis.cn/anolis/${ver}/${i}/${arch}/os/Packages/kernel-devel-${kernel_version}.rpm"
            wget -q -O /tmp/kernel-devel-${kernel_version}.rpm "${uri}" 
            if [ $? -eq 0 ];then
                echo "break eq 0"
                get=1
                break
            fi  
            continue
        done
        if [[ $get == 1 ]];then
            break
        fi
    done
 
    rpm2cpio /tmp/kernel-devel-${kernel_version}.rpm | cpio -dim 
	cp /tmp/usr/src/kernels/${kernel_version}/.config ${HOTFIX_PACKAGE_REPO}/kernel_config/config-${kernel_version}
	cp /tmp/kernel-devel-${kernel_version}.rpm ${HOTFIX_PACKAGE_REPO}/devel_pack/
    rm -fr /tmp/kernel-devel-${kernel_version}.rpm
    rm -fr /tmp/usr
	CONFIGFILE=${HOTFIX_PACKAGE_REPO}/kernel_config/config-${kernel_version}
}

function download_vmlinux() {
    local get=0
    for ver in ${os_version}
    do
        for i in ${os_type}
        do  
            uri="https://mirrors.openanolis.cn/anolis/${ver}/${i}/${arch}/debug/Packages/kernel-debuginfo-${kernel_version}.rpm"
            wget -q -O /tmp/kernel-debuginfo-${kernel_version}.rpm "${uri}" 
            if [ $? -eq 0 ];then
                echo "break eq 0"
                get=1
                break
            fi  
            continue
        done
        if [[ $get == 1 ]];then
            break
        fi
    done
 
    rpm2cpio /tmp/kernel-debuginfo-${kernel_version}.rpm | cpio -dim 
	cp /tmp/usr/lib/debug/lib/modules/${kernel_version}/vmlinux ${HOTFIX_PACKAGE_REPO}/vmlinux/vmlinux-${kernel_version}
	cp /tmp/kernel-debuginfo-${kernel_version}.rpm ${HOTFIX_PACKAGE_REPO}/debuginfo_pack/
    rm -fr /tmp/kernel-debuginfo-${kernel_version}.rpm && rm -fr /tmp/usr
	VMLINUX=${HOTFIX_PACKAGE_REPO}/vmlinux/vmlinux-${kernel_version}
}

# kpatch-build under kpatch_space
function prepare_kpatch(){
	devel_package=$DEV_PACKAGE
	echo "preparing kpatch, found devel_package : $devel_package "
	echo "installing dev_package..."
	rpm -ivh $devel_package

	kpatch_prefix="kpatch-build"
	kpatch_dir="${BASE}/${kpatch_prefix}"
	kpatch_build_path="${kpatch_dir}/kpatch-build/kpatch-build"

	cd ${BASE}/${kpatch_prefix}

	# make, if we choose to make kpatch.ko, we need to bind the specific kernel version 
	# because kpatch.ko is strongly connected to the kernel version
	if [ $arch == "x86_64" ]; then
		if [[ $USE_KPATCH_MODULE -eq 1 ]]; then
			echo "x86 : Building under kpatch module"
			if [[ -z $devel_package ]]; then
				die "Error: No kernel-devel package provided with kpatch-module. Unable to build!!"
			fi
			source_dir=/usr/src/kernels/${kernel}
			make KPATCH_BUILD=${source_dir} KERNELRELEASE=${kernel} clean
			make BUILDMOD=yes KPATCH_BUILD=/usr/src/kernels/${kernel} KERNELRELEASE=${kernel} && make BUILDMOD=yes install KERNELRELEASE=${kernel}
		else
			make -C ${kpatch_prefix} BUILDMOD=no && make -C ${kpatch_prefix} BUILDMOD=no install
		fi
	else
		if [[ $USE_KPATCH_MODULE -eq 1 ]]; then
			echo "arm : Building under kpatch module"
			if [[ -z $dev_package ]]; then
				die "Error: No kernel-devel package provided with kpatch-module. Unable to build!!"
			fi
			export NO_PROFILING_CALLS=1 && make -C ${kpatch_prefix} BUILDMOD=yes && make -C ${kpatch_prefix} BUILDMOD=yes install
		else
			export NO_PROFILING_CALLS=1 && make -C ${kpatch_prefix} BUILDMOD=no && make -C ${kpatch_prefix} install
		fi
	fi

	make install
	cd -
}

# checkout the branch or tag
function checkout_branch() {
	cd ${KSRCS}/${SRCREPO}
    repo_tag=`git tag | grep -w $tag -m 1`
	if [[ -z $repo_tag ]]; then
		repo_tag=`git branch -a | grep -w $tag -m 1`
	fi
	if [[ -z $repo_tag ]]; then
		die "the input tag cannot be found either in tag or branch"
	fi
    
    git checkout $repo_tag
    if [[ ! -d ${SRCPREFIX}/${kernel_version}/${kernel_version} ]];then
        mkdir -p ${SRCPREFIX}/${kernel_version}/${kernel_version}
    fi
	# copy ${KSRCS}/cloud-kernel to temp dir
    cp -a * ${SRCPREFIX}/${kernel_version}/${kernel_version}
    find ${SRCPREFIX}/${kernel_version}/${kernel_version} -name ".git" | xargs rm -rf

    ln -s ${SRCPREFIX}/${kernel_version} ${tmpdir} || die "create symbol link from src code to ${tmpdir} failed";
}

function prepare_environment(){
	echo "Prepare environment ..."
	set -x

    # build and install kpatch
	# prepare_kpatch
    source /etc/os-release

	if [[ ! -d ${tmpdir} ]]; then
		mkdir -p ${tmpdir}
	else
		echo "Remove all file under ${tmpdir}"
		rm -rf ${tmpdir}/*
	fi

	# for the supported kernel, no CONFIGFILE passed
	# prepare the config file and the vmlinx
	if [[ -z $CONFIGFILE ]]; then
		# check if we have this compress package of this version
		mkdir -p ${SRCPREFIX}
		if [[ -f ${HOTFIX_PACKAGE_REPO}/kernel/${kernel_version}.tar.gz ]];then
			tar zxf "${HOTFIX_PACKAGE_REPO}/${kernel_version}.tar.gz" -C ${SRCPREFIX} || die "untar ${kernel_version}.tar.gz failed...";
		else
			if [[ -e ${HOTFIX_PACKAGE_REPO}/kernel_config/config-${kernel_version} ]]; then
				CONFIGFILE=${HOTFIX_PACKAGE_REPO}/kernel_config/config-${kernel_version}
			else
				if [[ -e ${HOTFIX_PACKAGE_REPO}/devel_pack/kernel-devel-${kernel_version}.rpm ]]; then
					echo "EXISTS DEVEL RPM"
					cp ${HOTFIX_PACKAGE_REPO}/devel_pack/kernel-devel-${kernel_version}.rpm /tmp/b.rpm
					cd /tmp && rpm2cpio /tmp/b.rpm | cpio -dim 
					cp /tmp/usr/src/kernels/${kernel_version}/.config ${HOTFIX_PACKAGE_REPO}/kernel_config/config-${kernel_version}
					rm -rf /tmp/usr && rm -rf /tmp/b.rpm
					CONFIGFILE=${HOTFIX_PACKAGE_REPO}/kernel_config/config-${kernel_version}
				else
					download_config 
				fi  
			fi

			if [[ -e ${HOTFIX_PACKAGE_REPO}/vmlinux/vmlinux-${kernel_version} ]]; then
				VMLINUX=${HOTFIX_PACKAGE_REPO}/vmlinux/vmlinux-${kernel_version}
			else
				if [[ -e ${HOTFIX_PACKAGE_REPO}/debuginfo_pack/kernel-debuginfo-${kernel_version}.rpm ]]; then
					echo "EXISTS DEBUGINFO"
					cp ${HOTFIX_PACKAGE_REPO}/debuginfo_pack/kernel-debuginfo-${kernel_version}.rpm /tmp/b.rpm
					cd /tmp && rpm2cpio /tmp/b.rpm | cpio -dim 
					cp /tmp/usr/lib/debug/lib/modules/${kernel_version}/vmlinux ${HOTFIX_PACKAGE_REPO}/vmlinux/vmlinux-${kernel_version}
					rm -rf /tmp/usr && rm -rf /tmp/b.rpm
					VMLINUX=${HOTFIX_PACKAGE_REPO}/vmlinux/vmlinux-${kernel_version}
				else
					download_vmlinux
				fi
			fi
		fi
	fi

	# after the previous operation, devel-package should be downloaded
	DEV_PACKAGE=${HOTFIX_PACKAGE_REPO}/devel_pack/kernel-devel-${kernel_version}.rpm

	# build and install kpatch
	prepare_kpatch

    # checkout the source branch
	checkout_branch

	cd ${tmpdir}
	
	# rename the orig patch to ${kpatch_id}.patch
	cp ${patch} "${kpatch_id}".patch || die "copy ${PATCH_FILE} to ${kpatch_id}.patch failed";
	cp ${patch} patch || die "copy ${PATCH_FILE} to patch failed";
	echo "${description}" > description || die "output description failed";
	
	set +x
	# Make the version of hotfix ko equal to that of vmlinux.
	# Or it will fail when running "kpatch load <hotfix>.ko".
	export LOCALVERSION="${localversion}"
}

function do_kpatch_build(){
	echo "Start kpatch build ..."
	set -x

	if [ -f "$CHANGEINFOFILE" ]; then
		rm -rf "$CHANGEINFOFILE"
	fi

	touch $CHANGEINFOFILE
	export CHANGEINFOFILE

	echo "Using the Logfile is : $LOGFILE"
	export LOGFILE

	desc="hello world"
	
    cmd="${kpatch_build_path} "
	cmd_tail="--skip-compiler-check -a ${kernel_version} -n "${kpatch_id}" -s "${tmpdir}"/"${kernel_version}"/"${kernel_version}" -c "${CONFIGFILE}"  -o "${tmpdir}" -v "${VMLINUX}" "${tmpdir}"/"${kpatch_id}".patch "
	
	if [[ $USE_KPATCH_MODULE -eq 1 ]]; then
		cmd=${cmd}"--use-kpatch-module "${cmd_tail}
	else
		cmd=${cmd}" "${cmd_tail}
	fi
	
	echo $cmd >> $LOGFILE
	if [[ -z "$USERMODBUILDDIR" ]]; then
		if [ -z ${target} ]; then
	        $cmd
		else
	        $cmd -t vmlinux
		fi
	else
		# build oot module hotfix
		${kpatch_build_path} -n "${kpatch_id}" -s "${KERNEL_BUILD_PATH}" -m ${USERMODBUILDDIR} -c "$KERNEL_BUILD_PATH/.config" -v "${tmpdir}"/vmlinux --skip-gcc-check -o "${tmpdir}" "${tmpdir}"/"${kpatch_id}".patch
	fi

	if [ $? -ne 0 ]; then
		echo "Build kpatch failed, please check the log"
		echo ">>>>>>>>>>> The log is following >>>>>>>>>>"
		cat /root/.kpatch/build.log | tail -50 >> ${LOGFILE}
		die "FAILED";
	fi

	cp $CHANGEINFOFILE ${tmpdir}
	set +x
}

function do_rpmbuild(){
	echo "Start build rpm ..."
	mkdir rpmbuild
	chmod +x ${BASE}/../build_rpm.sh

	# because kpatch-build will replace all the . into - in $kpatch-id
	kofile=${kpatch_id//./-}

	if [[ $USE_KPATCH_MODULE -eq 1 ]]; then
		${BASE}/../build_rpm.sh --kpatch-module -m "${tmpdir}"/"${kofile}".ko -d ${dist} -e "${description}" -r "${tmpdir}"/rpmbuild -k "${kernel_version}" -c "${CHANGEINFOFILE}" -l "${release}" 2>&1 >> ${LOGFILE} 
	else
		${BASE}/../build_rpm.sh -m "${tmpdir}"/"${kofile}".ko -d ${dist} -e "${description}" -r "${tmpdir}"/rpmbuild -k "${kernel_version}" -c "${CHANGEINFOFILE}" -l "${release}" 2>&1 >> ${LOGFILE} 
	fi

	if [[ $? -ne 0 ]]; then
		die "FAILED"
	fi

	cp ${tmpdir}/rpmbuild/RPMS/${arch}/*.rpm ${NFS_RPM_DIR} || die "FAILED";
	echo "The rpm is : `ls ${pwddir}/*.rpm`";

	cd $pwddir 
	[ -d "./${kernel_version}" ] && rm -rf "./${kernel_version}"
	rm -f "./kpatch-${kpatch_id}"
}


# kaptch-build in ${hotfix_base}/kpatch_space
# kernel_src in ${hotfix_base}/kernel_repo
echo "Running build_hotfix.sh..."

os_type="
        Plus
        Experimental
    "
os_version="
        7.9
        8.6
        8.5
        8.4
        8.2
        8
        7.7
        23
        "

parse_args "$@";
prepare_environment;
do_kpatch_build;
do_rpmbuild;

echo "Running build_hotfix.sh finished..."
echo "Success"
exit 0