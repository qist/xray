# hysteria 服务端部署

```bash
下载地址：
cd /usr/local/src
https://github.com/HyNetwork/hysteria/releases

```

## 可执行权限 hysteria

```bash
wget https://github.com/apernet/hysteria/releases/download/app%2Fv2.1.0/hysteria-linux-amd64

chmod +x hysteria-linux-amd64
# 复制文件到上级目录
cp -pdr hysteria-linux-amd64 ../bin/
```

## 配置启动文件

```bash
### 方便 centos Ubuntu 使用
vim /etc/systemd/system/hysteria-server.service

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
ExecStart=/usr/local/bin/hysteria-linux-amd64 -c /etc/hysteria/config.yaml server
Restart=on-failure
RestartPreventExitStatus=1
RestartSec=5
[Install]
WantedBy=multi-user.target
```

### 配置 hysteria-server

```bash
mkdir /etc/hysteria
vim /etc/hysteria/config.yaml
listen: 0.0.0.0:443

obfs:
  type: salamander
  salamander:
    password: #密码

tls:
  cert: /apps/nginx/sslkey/tycng.com/ecc/fullchain.crt #证书路径
  key: /apps/nginx/sslkey/tycng.com/ecc/private.key # 证书密码

quic:
  initStreamReceiveWindow: 77881
  maxStreamReceiveWindow: 77882
  initConnReceiveWindow: 77883
  maxConnReceiveWindow: 77884
  maxIdleTimeout: 10s
  maxIncomingStreams: 256
  disablePathMTUDiscovery: true

bandwidth:
  up: 500 mbps
  down: 100 mbps

ignoreClientBandwidth: true

disableUDP: false
udpIdleTimeout: 120s

auth:
  type: password
  password: #密码


acl:
  inline:
    - cn_proxy(geoip:cn)
    - cn_proxy(ip.sb)
    - cn_proxy(*.ip.sb)
    - cn_proxy(ipinfo.io)
    - cn_proxy(*.ipinfo.io)
    - cn_proxy(openai.com)
    - cn_proxy(*.openai.com)
    - direct(all)

outbounds:
  - name: cn_proxy
    type: socks5
    socks5:
      addr: 127.0.0.1:26346
      username: #用户名
      password: #密码

masquerade:
  type: proxy
  proxy:
    url: https://www.lovelive-anime.jp
    rewriteHost: true
```

```
# 随机端口配置 
"protocol": "udp"
# 防火墙规则
firewall-cmd --add-forward-port=port=40000-50000:proto=udp:toport=443 --permanent
firewall-cmd --permanent --add-rich-rule='rule family="ipv6" forward-port port="40000-50000" protocol="udp" to-port="443"'
# 放行端口
firewall-cmd --add-port=40000-50000/udp --permanent
firewall-cmd --add-port=443/udp --permanent
firewall-cmd --permanent --add-rich-rule='rule family="ipv6" port port="40000-50000" protocol="udp" accept'
firewall-cmd --permanent --add-rich-rule='rule family="ipv6" port port="443" protocol="udp" accept'
# 生效
firewall-cmd --reload
```

## 启动 hysteria-server

`systemctl start hysteria-server`

## 设置开机启动

`systemctl enable hysteria-server`

## 查看启动状态

`systemctl status hysteria-server`

## 客户端配置

* [客户端配置](../clash.meta/README.md)
