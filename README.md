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

# 安装部署方法一

* 依赖

  [nodejs](https://nodejs.org/en/) 要求版本 >=12.0.0

* 打包：执行打包脚本 package.sh，生成发布包，用于部署。

	```
    # 前端打包需要本地已经具备yarn环境，如不具备，需要提前部署yarn环境，然后进到 sysom_web 目录执行 yarn 命令安装依赖包。
    # mac 环境下 yarn 安装可以采用脚本：curl -o- -L https://yarnpkg.com/install.sh | bash
    # 安装yarn完成后，执行下列命令打包项目
	bash package.sh
	```
* 部署：将发布包拷贝到目标机器上，解压，进入到目录中执行部署脚本。

	```
 	tar xf sysomRelease-20211207022031.tar.gz
 	cd sysomRelease-20211207022031
    # 使用deploy.sh脚本部署项目，需要带三个参数，
    # arg1 : 部署目录，
    # arg2 : 内网IP（主要是方便内网通讯，用户需要保证内网能通）
    # arg3 : 外网IP（浏览器可以访问到的IP地址)
 	bash deploy.sh /usr/local/sysom 192.168.100.100 100.100.22.22
	```

# 安装部署方法二
* 依赖

  [nodejs](https://nodejs.org/en/) 要求版本 >=12.0.0

* 打包：执行打包脚本 package_rpm_online.sh，生成发布包，用于部署。

	```
    # 前端打包需要本地已经具备yarn环境，如不具备，需要提前部署yarn环境，然后进到 sysom_web 目录执行 yarn 命令安装依赖包。
    # mac 环境下 yarn 安装可以采用脚本：curl -o- -L https://yarnpkg.com/install.sh | bash
    # 安装yarn完成后，执行下列命令打包项目
    # 由于是制作rpm包，因此也需要打包具备制作rpm的条件，如rpmbuild，python3命令等。
	bash package_rpm_online.sh
	```
* 部署：将发布包拷贝到目标机器上，使用yum或者rpm命令安装，进入到目录中执行部署脚本。

	```
 	rpm -ivh sysom-2.0-1.an8.x86_64.rpm
 	或yum install -y sysom-2.0-1.an8.x86_64.rpm
    # 默认安装路径为/usr/local/sysom下
    # 默认配置使用的nginx对外端口为80，可以通过export SERVER_PORT=xxx来设置
    # 默认配置的内网IP是通过ip -4 route命令查找的第一个IP，可以通过export SERVER_LOCAL_IP=xxx.xxx.xxx.xxx来设置
    # 使用以下命令进行启动:
 	bash -x /usr/local/sysom/init_scripts/server/init.sh
	```
