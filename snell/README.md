# snell 服务端部署
```
下载地址：
cd /usr/local/src
https://github.com/surge-networks/snell/releases
```
#### 解压 snell
```
unzip 下载对应版本名
# 复制文件到上级目录
cp -pdr snell-server ../bin/
```
#### 配置启动文件
```
### 方便 centos Ubuntu 使用
vim /etc/systemd/system/snell-server.service

[Unit]
Description=snell-server
Documentation=https://github.com/surge-networks/snell
After=network.target network-online.target nss-lookup.target

[Service]
Type=simple
StandardError=journal
ExecStart=/usr/local/bin/snell-server -c /etc/snell/snell-server.conf
ExecReload=/bin/kill -HUP $MAINPID
LimitNOFILE=51200
Restart=on-failure
RestartSec=1s

[Install]
WantedBy=multi-user.target
```
### 配置 snell-server
```
mkdir /etc/snell
vim /etc/snell/snell-server.conf
Generating new config...
[snell-server]
listen = 0.0.0.0:9443 # 监听端口
psk = password # password 自定义
obfs = tls # http or tls
```
# 启动 snell-server
` systemctl start snell-server
# 设置开机启动
` systemctl enable snell-server
# 查看启动状态
` systemctl status snell-server

#### 客户端配置
* [客户端配置](../clash/README.md)