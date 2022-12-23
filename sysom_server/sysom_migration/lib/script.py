ass_imp_script = '''
wget REPO_URL/anolis/migration/anolis-migration.repo -O /etc/yum.repos.d/anolis-migration.repo
sed -i "s#baseurl=https://mirrors.openanolis.cn/#baseurl=REPO_URL/#" /etc/yum.repos.d/anolis-migration.repo
sed -i "s#gpgkey=https://mirrors.openanolis.cn/#gpgkey=REPO_URL/#" /etc/yum.repos.d/anolis-migration.repo
yum install -y python-pip
yum remove -y python-requests python-urllib3; pip uninstall requests urllib3 -y 2>/dev/null || echo "not installed"
yum -y install leapp
sed -i "s#baseurl=https://mirrors.openanolis.cn/#baseurl=REPO_URL/#" /etc/leapp/files/leapp_upgrade_repositories.repo
leapp preupgrade --no-rhsm
'''

init_ance_script = '''
yum install epel-release -y
yum install ANCE_RPM_PATH -y
ance --help
'''

ass_sys_script = '''
ance evaluate  --etype=os --os1=/ --os2=ANCE_SQL_PATH --limit=0
'''

ass_hard_script = '''
ance evaluate  --etype=hardware --os1=/ --os2=ANCE_SQL_PATH
'''

ass_app_script = '''
ance evaluate  --etype=dep --os1=/ --os2=ANCE_SQL_PATH --repo2=/etc/leapp/files/leapp_upgrade_repositories.repo RPM_LIST
'''

init_info_script = '''
echo base_info:主机名称=$(hostname),IP地址=$(hostname -I | awk '{print $1}'),账户信息=$(cat /etc/passwd | awk -F : '{print $1}')
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
yum install rear genisoimage syslinux nfs-utils python3 wget -y
wget https://gitee.com/src-anolis-sig/leapp-repository/raw/wip_migrear/migrear -O /usr/sbin/migrear
chmod +x /usr/sbin/migrear
BACKUP_SCRIPT
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
/usr/sbin/migrear --recover_preset yes
'''

def run_script(script):
    return ' && '.join(script.strip().split('\n'))


def run_script_ignore(script):
    return '; '.join(script.strip().split('\n'))
