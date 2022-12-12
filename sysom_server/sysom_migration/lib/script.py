init_info_script = '''
echo base_info:主机名称=$(hostname),IP地址=$(hostname -I | awk '{print $1}')
echo hard_info:CPU架构=$(arch),CPU型号=$(lscpu |grep '^Model name' | awk -F ':' '{print $2}'),CPU核数=$(nproc),内存=$(free -h | grep '^Mem' | awk '{print $2}')
echo soft_info:操作系统版本=$(cat /etc/os-release | grep '^PRETTY_NAME=' | awk -F '"' '{print $2}'),内核版本=$(uname -r),gcc版本=$(rpm -qa gcc),glibc版本=$(rpm -qa glibc)
'''

deploy_tools_script = '''
wget REPO_URL/anolis/migration/anolis-migration.repo -O /etc/yum.repos.d/anolis-migration.repo
sed -i "s#baseurl=https://mirrors.openanolis.cn/#baseurl=REPO_URL/#" /etc/yum.repos.d/anolis-migration.repo
sed -i "s#gpgkey=https://mirrors.openanolis.cn/#gpgkey=REPO_URL/#" /etc/yum.repos.d/anolis-migration.repo
yum install -y python-pip
yum remove -y python-requests python-urllib3; pip uninstall requests urllib3 -y 2>/dev/null || echo "not installed"
yum -y install leapp
sed -i "s#baseurl=https://mirrors.openanolis.cn/#baseurl=REPO_URL/#" /etc/leapp/files/leapp_upgrade_repositories.repo
'''

backup_script = '''
yum install migration-rear -y
'''

mig_ass_script = '''
mkdir -p REPLACE_DIR
leapp preupgrade --no-rhsm > REPLACE_FILE
'''

mig_imp_script = '''
mkdir -p REPLACE_DIR
leapp upgrade --no-rhsm > REPLACE_FILE
'''

restore_script = '''
yum install migration-rear -y
'''

def run_script(script):
    return ' && '.join(script.strip().split('\n'))


def run_script_ignore(script):
    return '; '.join(script.strip().split('\n'))
