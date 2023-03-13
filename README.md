
# 简介
致力于打造一个集主机管理、配置部署、监控报警、异常诊断、安全审计等一系列功能的自动化运维平台。
探索创新的sysAK、ossre诊断工具及高效的LCC（Libbpf Compiler Collection）开发编译平台和netinfo网络抖动问题监控系统等，
实现系统问题的快速上报、分析与解决，提升集群的全自动运维效率，构建大规模集群运维生态链。

# 目标
通过社区合作，打造出一个自动化运维平台，涵盖云场景中各种典型服务场景，包括线上问题分析诊断、资源和异常事件监控、系统修复业务止血，
安全审计和CVE补丁推送等各种功能，提供强大的底层系统运维能力，融合到统一的智能运维平台，实现自动化运维。

# 功能
* 主机管理 
* 配置中心 
* 安全审计
* 监控报警
* 智能问题诊断 
* 发布部署

# 安装部署
## 1. 编译部署
### 1.1 依赖
- nodejs >= 12.0.0
- python >= 3.6
- git
- tar
- wget

### 1.2 编译

- 依赖安装

  ```bash
  dnf module install nodejs:16 -y
  npm install -g yarn
  dnf install git tar wget -y
  ```

- 编译打包

  ```bash
  git clone https://gitee.com/anolis/sysom.git
  cd sysom
  bash package.sh
  ```

  输出包含如下结果表示编译成功：
  [外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-dbTldAef-1676539163032)(https://foruda.gitee.com/images/1674977326579767317/e08cc909_643601.png "编译日志.png")]

  执行完之后使用 `tree -L 1` 查看当前文件夹分布如下：

  ```bash
  .
  ├── LICENSE
  ├── package_rpm_offline.sh
  ├── package_rpm_online.sh
  ├── package.sh
  ├── README.md
  ├── script
  ├── sysomRelease-20230129142347.tar.gz
  ├── sysom_server
  ├── sysom_web
  └── tools
  ```

  > 注意：打包出的 release 包的命名格式为 `sysomRelease-xxx.tar.gz` ，其中 `xxx` 为打包时的时间，因此每次打包时生成的压缩包名称都是不同的

### 1.3 热补丁编译机（builder）设置
用户需要使用热补丁中心的功能时，需要配置热补丁的编译机。

- 在单机部署的情况下，可以忽略本步骤，部署完毕即可使用
- 在多机部署的情况下，请确保builder机器与server机器在同一网段内。需要配置sysom/script/server/6_sysom_hotfix_builder下的init.sh以及sysom_server/sysom_hotfix_builder下的builder.ini

  ```bash
  #! /bin/bash
  SERVER_DIR="sysom_server"
  HOTFIX_BUILDER_DIR=${SERVER_DIR}/sysom_hotfix_builder
  VIRTUALENV_HOME=${SERVER_HOME}/virtualenv
  SERVICE_NAME=sysom-hotfix-builder
  NFS_SERVER_IP=${SERVER_LOCAL_IP}  # 将NFS_SEVER_IP配置为sysom主服务器的内网ip地址
  ```
  
  builder.ini
  ```bash
  [sysom_server]
  server_ip = http://127.0.0.1  # sysom主服务器的ip地址
  account = account             # 用于登录sysom的账户
  password = password           # 用于登录sysom的密码

  [cec]
  cec_url = redis://127.0.0.1:6379  # 此处指向sysom主服务器的redis地址，填写内网ip地址

  [builder]
  hotfix_base = /hotfix_build/hotfix                      # 此处配置hotfix构建的工作目录
  nfs_dir_home = /usr/local/sysom/server/builder/hotfix   # 此处构建与sysom主服务器共享目录的路径
  package_repo = /hotfix/packages                         # 缓存设定路径
  ```


> 注意：在多机部署的情况下，角色为builder的机器可以在/sysom/server/conf下仅使能[base]和[hotfix-builder]这两个服务即可；此外，需要修改server的redis配置文件(如/etc/redis.conf)，允许其他机器访问server的redis，否则服务会不可用 。
### 1.4 部署

- 解压 release 包

  > 注意下面压缩包的名称要替换成实际打包出的 release 包的名称

  ```bash
  tar -zxvf sysomRelease-20230129142347.tar.gz
  cd sysomRelease-20230129142347
  ```

  解压完成后，Release 包内的文件分布如下：

  ```bash
  .
  ├── clear.sh
  ├── deploy.sh
  ├── script
  ├── sysom_server
  ├── sysom_web
  └── tools
  ```

- 使用 `deploy.sh` 脚本进行部署

  - 首先使用 `ifconfig` 查看当前机器的IP => 比如：`172.22.3.238`

  - `deploy.sh` 部署脚本参数说明

    ```bash
    bash deploy.sh <部署目录> <内网IP> <外网IP>
    ```

    - arg1 : 部署目录
    - arg2 : 内网IP（主要是方便内网通讯，用户需要保证内网能通）
    - arg3 : 外网IP（浏览器可以访问到的IP地址)

  - 使用 `deploy.sh` 脚本进行一键部署

    如果没有公网IP，均使用内网IP即可，实际部署时可以替换成公网IP

    ```bash
    ./deploy.sh /usr/local/sysom 172.22.3.238 172.22.3.238
    ```

  - 当服务日志输出下列日志表示部署成功：

    ```bash
    Oct 10 12:58:51 mfeng bash[3217754]: /usr/local/sysom/init_scripts/server
    Oct 10 12:58:51 mfeng bash[3217754]: + for dir in `ls`
    Oct 10 12:58:51 mfeng bash[3217754]: + '[' -d init.sh ']'
    Oct 10 12:58:51 mfeng bash[3217754]: + for dir in `ls`
    Oct 10 12:58:51 mfeng bash[3217754]: + '[' -d stop.sh ']'
    Oct 10 12:58:51 mfeng bash[3217754]: + sed -i 's/^FIRST_INIT_DONE=0/FIRST_INIT_DONE=1/g'     /usr/local/sysom/init_scripts/server/init.sh
    ```

## 2. RPM打包部署

### 2.1 依赖

- nodejs >= 12.0.0
- python >= 3.6
- git
- tar
- wget
- Rpmbuild

### 2.2 编译

- 依赖安装

  ```bash
  dnf module install nodejs:16 -y
  npm install -g yarn
  dnf install git tar wget rpm-build -y
  ```

- 生成 RPM 包

  ```bash
  # 前端打包需要本地已经具备yarn环境，如不具备，需要提前部署yarn环境，然后进到 sysom_web 目录执行 yarn 命令安装依赖包。
  # mac 环境下 yarn 安装可以采用脚本：curl -o- -L https://yarnpkg.com/install.sh | bash
  # 安装yarn完成后，执行下列命令打包项目
  # 由于是制作rpm包，因此也需要打包具备制作rpm的条件，如rpmbuild，python3命令等。
  bash package_rpm_online.sh
  ```

  打包完成后，生成的 RPM 包被存放在 `/root/rpmbuild/RPMS/x86_64` 下面，使用 `tree -L 1 /root/rpmbuild/RPMS/x86_64` 查看的结果如下：

  ```bash
  /root/rpmbuild/RPMS/x86_64
  └── sysom-2.0-1.an8.x86_64.rpm
  ```

  > 注意：RPM包的名称会随 sysom 的版本、打包机器的架构和发行版本而变化，因此实际使用 RPM 包时，以实际的名称为准。

### 2.3 部署

- 安装 rpm 包

  ```bash
  rpm -ivh sysom-2.0-1.an8.x86_64.rpm
  # 或 yum install -y sysom-2.0-1.an8.x86_64.rpm
  ```

  - 默认安装路径为 `/usr/local/sysom` 下
  - 默认配置使用的nginx对外端口为80，可以通过 `export SERVER_PORT=xxx` 来设置
  - 默认配置的内网IP是通过 `ip -4 route` 命令查找的第一个IP，可以通过 `export SERVER_LOCAL_IP=xxx.xxx.xxx.xxx` 来设置

- 启动

  ```bash
  # 使用以下命令进行启动:
  bash -x /usr/local/sysom/init_scripts/server/init.sh
  ```

- 当服务日志输出下列日志表示部署成功：

  ```bash
  Oct 10 12:58:51 mfeng bash[3217754]: /usr/local/sysom/init_scripts/server
  Oct 10 12:58:51 mfeng bash[3217754]: + for dir in `ls`
  Oct 10 12:58:51 mfeng bash[3217754]: + '[' -d init.sh ']'
  Oct 10 12:58:51 mfeng bash[3217754]: + for dir in `ls`
  Oct 10 12:58:51 mfeng bash[3217754]: + '[' -d stop.sh ']'
  Oct 10 12:58:51 mfeng bash[3217754]: + sed -i 's/^FIRST_INIT_DONE=0/FIRST_INIT_DONE=1/g'     /usr/local/sysom/init_scripts/server/init.sh
  ```

## 3. 通过 WEB 前端访问

部署成功之后，可以通过访问部署时指定的公网/私网地址访问 SysOM前端，比如 http://172.22.3.238

- 默认的用户名密码：admin/123456
- SysOM提供了 Demo 体验网站，可以访问：http://sysom.openanolis.cn/


