init_info_script = '''
echo base_info:主机名称=$(hostname),IP地址=$(hostname -I | awk '{print $1}')
echo hard_info:CPU架构=$(arch),CPU型号=$(lscpu |grep '^Model name' | awk -F ':' '{print $2}'),CPU核数=$(nproc),内存=$(free -h | grep '^Mem' | awk '{print $2}')
echo soft_info:操作系统版本=$(cat /etc/os-release | grep '^PRETTY_NAME=' | awk -F '"' '{print $2}'),内核版本=$(uname -r),gcc版本=$(rpm -qa gcc),glibc版本=$(rpm -qa glibc)
'''

run_imp_script = '''
wget https://mirrors.openanolis.cn/anolis/migration/anolis-migration.repo -O /etc/yum.repos.d/anolis-migration.repo
pip list | grep requests && pip uninstall requests urllib3 -y
yum -y install leapp
yum -y install python-urllib3 python-requests
leapp preupgrade --no-rhsm
leapp upgrade --no-rhsm
'''