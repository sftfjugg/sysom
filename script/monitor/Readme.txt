本目录脚本主要用于一键部署prometheus + grafana监控
主要有以下步骤：
1、从grafana官网下载grafana安装包，并安装启动
2、从prometheus官网下载prometheus的安装包，并安装启动，设置systemd 服务
3、从prometheus官网下载node_exporter安装包
4、配置grafana的prometheus数据库，配置dashboard


直接在sysom server机器，执行bash -x monitor_server_deploy.sh脚本即可。

另外，
1、如果受外网访问限制，你也可以预先下载好grafana,prometheus,node_exporter等安装包，
并把安装包，放置到/usr/local/sysom/monitor目录下。
2、sysom项目，当前采用grafana-8.2.5-1.x86_64.rpm，prometheus-2.29.1.linux-amd64.tar.gz，node_exporter-1.2.2.linux-amd64.tar.gz
等软件包版本，如果你需要使用其它软件包版本进行安装，你需要修改一下monitor_server_deploy.sh中的版本号信息。
