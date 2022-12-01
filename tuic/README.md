# tuic 服务端部署

```bash
下载地址：
cd /usr/local/src
https://github.com/EAimTY/tuic/releases

```

## 可执行权限 tuic

```bash
wget https://github.com/EAimTY/tuic/releases/download/0.8.5/tuic-server-0.8.5-x86_64-linux-gnu

chmod +x tuic-server-0.8.5-x86_64-linux-gnu
# 复制文件到上级目录
cp -pdr tuic-server-0.8.5-x86_64-linux-gnu ../bin/
```

## 配置启动文件

```bash
### 方便 centos Ubuntu 使用
vim /etc/systemd/system/tuic-server.service

[Unit]
[Unit]
Description=tuic, a feature-packed network utility optimized for networks of poor quality
Documentation=https://github.com/EAimTY/tuic#readme
After=network.target
[Service]
User=root
CapabilityBoundingSet=CAP_NET_BIND_SERVICE CAP_NET_RAW
AmbientCapabilities=CAP_NET_BIND_SERVICE CAP_NET_RAW
NoNewPrivileges=true
WorkingDirectory=/etc/tuic
ExecStart=/usr/local/bin/tuic-server-0.8.5-x86_64-linux-gnu -c /etc/tuic/config.json
Restart=on-failure
RestartPreventExitStatus=1
RestartSec=5
[Install]
WantedBy=multi-user.target
```

### 配置 tuic-server

```bash
mkdir /etc/tuic
vim /etc/tuic/config.json
{
    "port": 36716,
    "token": [
        "ewqerq-08B6-4BDB-8E34-dfweqwerfq"
    ],
    "certificate": "/apps/nginx/sslkey/tycng.com/ecc/fullchain.crt",
    "private_key": "/apps/nginx/sslkey/tycng.com/ecc/private.key",
    "ip": "0.0.0.0",
    "congestion_controller": "bbr",
    "alpn": [
        "h3"
    ],
    "max_udp_relay_packet_size": 1146
}

```

## 启动 tuic-server

`systemctl start tuic-server`

## 设置开机启动

`systemctl enable tuic-server`

## 查看启动状态

`systemctl status tuic-server`

## 客户端配置

* [客户端配置](../clash.meta/README.md)
