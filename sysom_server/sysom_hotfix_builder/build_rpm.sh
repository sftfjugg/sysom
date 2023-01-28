#!/bin/bash
function usage(){
	echo "Usage:";
	echo "./build_rpm.sh [OPTIONS]"
	echo ""
	echo "Options:"
	echo "  --module"
	echo "      The ko path"
	echo "  --distro"
	echo "      distro"
	echo "  --rpmbuild"
	echo "      rpmbuild path"
	echo "  --kernel"
	echo "      kernel version"
	echo "  --release"
	echo "      kernel release"
	echo "  --description"
	echo "      The description of this hotfix"
	echo "  --help"
	echo  "     For help"
}

function parse_args(){
	ARGS=`getopt -l module:,distro:,rpmbuild:,kernel:,release:,description:,changeinfo:,help -o hm:d:r:k:c:e:l: -- "$@" 2>/dev/null` || { usage; exit 1; }
	eval set -- "${ARGS}"
	while [ -n "$1" ]
	do
		case "$1" in
		-m|--module)
			module="$2"
			shift
			;;
		-d|--distro)
			distro="$2"
			shift
			;;
		-r|--rpmbuild)
			rpmbuild="$2"
			shift
			;;
		-k|--kernel)
			kernel="$2"
			shift
			;;
		-c|--changeinfo)
			changeinfo="$2"
			shift
			;;
		-e|--description)
			description="$2"
			shift
			;;
		-l|--release)
			release="$2"
			shift
			;;
		-h|--help)
			usage
			;;
		--)
			shift
			break
			;;
		esac
		shift
	done
	
	if [[ -z ${description} ]] ; then
		description="This hotfix have no description"
	fi

	if [[ -z ${distro} ]] ; then
		distro="Anolis"
	fi
	
	if [[ -z ${rpmbuild} ]] ; then
		rpmbuild="`pwd`"
	fi

	if [[ -z ${module} || -z ${kernel} || -z ${description} || -z ${changeinfo} || -z ${release} ]] ; then
		usage;
		exit 1
	fi
}

function prepare_spec(){
	# $arch is like "x86_64" or "aarch64"
	arch="${kernel##*.}"
    kernel_wo_arch=${kernel%.*}

	# $hotfix_file is like 'kpatch-test-stat.ko'
	hotfix_file=`basename ${module}`
	
	# $hotfix_base is like 'test-stat'
	hotfix_base=`echo ${hotfix_file#*-} |cut -d . -f 1`

	# $hotfix_ko_name is like 'kpatch-test-stat'
	hotfix_ko_name=`echo ${hotfix_file%.ko}`

	# $module_name is like 'kpatch_test_stat'
	module_name="${hotfix_ko_name//-/_}"

	hotfix_dir_path="%{_prefix}/%{_kernel_version}/${hotfix_base}"
	hotfix_ko_path="${hotfix_dir_path}/${hotfix_file}"
	install_path="\$RPM_BUILD_ROOT%{_prefix}/%{_kernel_version}/${hotfix_base}/"

    hotfix_apply="/usr/sbin/kpatch load %{_prefix}/\$(uname -r)/${hotfix_base}/${hotfix_file}"
    hotfix_apply_prefix="/usr/sbin/kpatch load"
    hotfix_undo="yes | /usr/sbin/kpatch unload %{_prefix}/\$(uname -r)/${hotfix_base}/${hotfix_file}"
	hotfix_spec="
%define srcname ${hotfix_file} 
%define _prefix /var/khotfix
%define _kernel_version ${kernel}
%define _kernel_release ${release}
%define _kernel_version_wo_arch ${kernel_wo_arch}
%define _ks_prefix /usr/local

Summary: Hotfix for Kernel
Name: kernel-hotfix-${hotfix_base}-%{_kernel_release}
version: 1.0
Release: ${RELEASE:-1}.${distro}
License: GPL
Packager: Sysom <git@gitee.com:anolis/sysom.git>
Group: applications
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root
BuildArch: ${arch}
Source0: "${module}"
Source1: patch
Source2: description

Requires: kpatch >= 0.8.0-1.5


%description
hotfix rpm build : ${description}

%install
mkdir -p ${install_path}
cp \$RPM_SOURCE_DIR/${hotfix_file} ${install_path} 
cp \$RPM_SOURCE_DIR/patch ${install_path}
cp \$RPM_SOURCE_DIR/description ${install_path}
cp \$RPM_SOURCE_DIR/changeinfo ${install_path}
"
	hotfix_spec=${hotfix_spec}"
%files
${hotfix_dir_path}/

%clean
%{__rm} -rf \$RPM_BUILD_ROOT

%pre
if [ \"\$(uname -r)\" != \"%{_kernel_version}\" ]; then
	echo \"kernel version does not match\"
	exit -1
fi

%posttrans
systemctl enable kpatch || exit 1
"

	hotfix_spec=${hotfix_spec}"
kpatch install -k ${kernel} ${hotfix_ko_path} || exit -1
if [ \"\$(uname -r)\" == \"%{_kernel_version}\" ]; then
	${hotfix_apply} || exit -1
fi

%preun
if [ \"\$(uname -r)\" == \"%{_kernel_version}\" ]; then
	${hotfix_undo}

fi
kpatch uninstall -k ${kernel} ${hotfix_file}
"
}

function prepare_environment(){
	echo "Preparing rpm package enviroment..."
	mkdir -p "${rpmbuild}"/{BUILD,RPMS,SOURCES,SPECS,SRPMS}
	cp ${module} "${rpmbuild}"/SOURCES/	
	cp patch "${rpmbuild}"/SOURCES/
	cp description "${rpmbuild}"/SOURCES/
	cp changeinfo "${rpmbuild}"/SOURCES/
	echo "${hotfix_spec}" > "${rpmbuild}"/SPECS/"${hotfix_ko_name}".spec
}

function do_rpmbuild(){
	rpmbuild -bb "${rpmbuild}"/SPECS/"${hotfix_ko_name}".spec --define "%_topdir $rpmbuild"
}
parse_args "$@";
prepare_spec;
prepare_environment;
do_rpmbuild;