# hysteria 服务端部署

```bash
下载地址：
cd /usr/local/src
https://github.com/HyNetwork/hysteria/releases

```

## 可执行权限 hysteria

```bash
wget https://github.com/HyNetwork/hysteria/releases/download/v1.2.2/hysteria-linux-amd64

chmod +x hysteria-linux-amd64
# 复制文件到上级目录
cp -pdr hysteria-linux-amd64 ../bin/
```

## 配置启动文件

```bash
### 方便 centos Ubuntu 使用
vim /etc/systemd/system/hysteria-server.service

[Unit]
[Unit]
Description=Hysteria, a feature-packed network utility optimized for networks of poor quality
Documentation=https://github.com/HyNetwork/hysteria/wiki
After=network.target
[Service]
User=root
CapabilityBoundingSet=CAP_NET_BIND_SERVICE CAP_NET_RAW
AmbientCapabilities=CAP_NET_BIND_SERVICE CAP_NET_RAW
NoNewPrivileges=true
WorkingDirectory=/etc/hysteria
Environment=HYSTERIA_LOG_LEVEL=info
ExecStart=/usr/local/bin/hysteria -c /etc/hysteria/config.json server
Restart=on-failure
RestartPreventExitStatus=1
RestartSec=5
[Install]
WantedBy=multi-user.target
```

### 配置 hysteria-server

```bash
mkdir /etc/hysteria
vim /etc/hysteria/config.json
{
    "listen": ":36712",  // 监听地址
    "protocol": "wechat-video",  // 留空或 "udp", "wechat-video", "faketcp"
    "cert": "/apps/nginx/sslkey/tycng.com/ecc/fullchain.crt", // 证书 
    "key": "/apps/nginx/sslkey/tycng.com/ecc/private.key", // 证书密钥
    "up": "200 Mbps", // 单客户端最大上传速度，和 "up_mbps" 互斥
    "up_mbps": 100, // 单客户端最大上传速度 Mbps
    "down": "200 Mbps", // 单客户端最大下载速度，和 "down_mbps" 互斥
    "down_mbps": 200, // 单客户端最大下载速度 Mbps
    "disable_udp": false, // 禁用 UDP 支持
    "acl": "acl_list.acl", //ACL  配置
    "mmdb": "GeoLite2-Country.mmdb", // MaxMind IP 库 (ACL)
    "obfs": "1234567898", // 混淆密码
    "auth": { // 验证
    "mode": "passwords", // 验证模式，目前支持 "none", "passwords", "external"
    "config": ["juestnow", "965328452", "Мать-Россия"] 
    },
    "recv_window_conn": 15728640, // QUIC stream receive window
    "recv_window_client": 67108864, // QUIC connection receive window
    "max_conn_client": 4096, // 单客户端最大活跃连接数
    "disable_mtu_discovery": true, // 禁用 MTU 探测 (RFC 8899)
    "resolve_preference": "4" // DNS IPv4/IPv6 优先级。可用选项 "64" (IPv6 优先，可回落到 IPv4) "46" (IPv4 优先，可回落到 IPv6) "6" (仅 IPv6) "4" (仅 IPv4)
}
cd /etc/hysteria
# 下载GeoLite2-Country.mmdb
wget https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb
# 配置acl
vim acl_list.acl
block country cn 
[ACL用法](https://github.com/HyNetwork/hysteria/wiki/%E5%85%B3%E4%BA%8E-ACL)
```

## 启动 hysteria-server

`systemctl start hysteria-server`

## 设置开机启动

`systemctl enable hysteria-server`

## 查看启动状态

`systemctl status hysteria-server`

## 客户端配置

* [客户端配置](../clash.meta/README.md)
