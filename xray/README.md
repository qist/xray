# Xray ws 模式安装

#### 下载 Xray
```
mkdir -p /usr/local/xray

cd /usr/local/xray

https://github.com/XTLS/Xray-core/releases

```
#### 解压 Xray
```
unzip  下载对应版本名

```
#### 配置启动文件
# 目录方式启动
* [xray 启动配置](./xray.service) 
```
### 方便 centos Ubuntu 使用
vim /etc/systemd/system/xray.service
[Unit]
Description=Xray Service
Documentation=https://github.com/xtls
After=network.target nss-lookup.target
[Service]
#User=nobody
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ExecStart=/usr/local/xray/xray run -config /etc/xray/config.json
Restart=on-failure
RestartPreventExitStatus=23
LimitNPROC=10000
LimitNOFILE=1000000
[Install]
WantedBy=multi-user.target

vim /etc/systemd/system/xray@.service
[Unit]
Description=Xray Service
Documentation=https://github.com/xtls
After=network.target nss-lookup.target
[Service]
#User=nobody
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ExecStart=/usr/local/xray/xray run -config /etc/xray/%i.json
Restart=on-failure
RestartPreventExitStatus=23
LimitNPROC=10000
LimitNOFILE=1000000
[Install]
WantedBy=multi-user.target
```

#### 配置 xray
# xray 配置参考
* [xray 配置](./xray)
```
v2 配置在线生成
https://intmainreturn0.com/v2ray-config-gen/

mkdir /etc/xray

vim /etc/xray/config.json
{
  "log" : {
    "access": "/var/log/xray/ws-access.log",
    "error": "/var/log/xray/ws-error.log",
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 9999,
      "listen": "127.0.0.1",
      "protocol": "vmess",
      "settings": {
        "clients": [
          {
            "id": "ef489692-36ed-0315-6dd1-dddderwer",
            "alterId": 64
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "security": "none",
        "wsSettings": {
          "path": "/",
          "headers": {}
        }
      },
      "tag": "",
      "sniffing": {
        "enabled": true,
        "destOverride": [
          "http",
          "tls"
        ]
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    }
  ]
}
# vmess gprc
{
    "log": {
        "access": "/var/log/xray/grpc-access.log",
        "error": "/var/log/xray/grpc-error.log",
        "loglevel": "warning"
    },
   "inbounds":[
    {
        "port": 31301,
        "listen": "127.0.0.1",
        "protocol": "vmess",
        "tag":"VLESSGRPC",
        "settings": {
            "clients": [
                {
                    "id": "d9e5d918-91f8-49ee-94a3-fsdfafdaerwer",
            "alterId": 64,
                    "add": "ocezs.tycng.com",
                    "email": "ocezs.tycng.com_VLESS_gRPC"
                }
            ],
            "decryption": "none"
        },
        "streamSettings": {
            "network": "grpc",
            "grpcSettings": {
                "serviceName": "sbwhgrpc"
            }
        }
    }
    ],
    "outbounds": [
        {
            "protocol": "freedom"
        }
    ]
}
# trojan gprc
{
    "log": {
        "access": "/var/log/xray/trojan-access.log",
        "error": "/var/log/xray/trojan-error.log",
        "loglevel": "warning"
    },
    "inbounds": [
        {
            "port": 6565,
            "protocol": "trojan",
            "settings": {
                "clients": [
                    {
                        "password": "e45dfc88e0ec",
                        "email": "dvns.tycng.com_VLESS_gRPC"
                    }
                ]
            },
            "streamSettings": {
                "network": "grpc",
                "security": "none",
                "grpcSettings": {
                    "serviceName": "trojan"
                }
                }
            }
    ],
    "outbounds": [
        {
            "protocol": "freedom"
        }
    ]
}
#trojan  tls
{
    "log": {
        "access": "/var/log/xray/trojan-tls-access.log",
        "error": "/var/log/xray/trojan-tls-error.log",
        "loglevel": "warning"
    },
    "inbounds": [
        {
            "port": 20001,
            "protocol": "trojan",
            "settings": {
                "clients": [
                    {
                        "password": "XS0YRS7",
                        "email": "love@example.com"
                    }
                ]
            },
            "streamSettings": {
                "network": "tcp",
                "security": "tls",
                "tlsSettings": {
                    "alpn": [
                         "h2",
                        "http/1.1"
                    ],
                    "certificates": [
                        {
                            "certificateFile": "/apps/nginx/sslkey/tycng.com/certificate.crt",
                            "keyFile": "/apps/nginx/sslkey/tycng.com/private.key"
                        }
                    ]
                }
            }
        }
    ],
    "outbounds": [
        {
            "protocol": "freedom"
        }
    ]
}
# ss 配置
{
    "log": {
        "access": "/var/log/xray/ss-access.log",
        "error": "/var/log/xray/ss-error.log",
        "loglevel": "warning"
},
    "inbounds": [
        {
            "port": 222,
            "protocol": "shadowsocks",
            "settings": {
                "clients": [
                    {
                        "password": "password",
                        "method": "chacha20-ietf-poly1305"
                    }
                ],
                "network": "tcp,udp"
            }
        },
        {
            "port": 7789,
            "protocol": "shadowsocks",
            "settings": {
                "clients": [
                    {
                        "password": "password",
                        "method": "chacha20-ietf-poly1305"
                    }
                ],
                "network": "tcp,udp"
            }
        },
        {
            "port": 17788,
            "protocol": "shadowsocks",
            "settings": {
                "clients": [
                    {
                        "password": "password",
                        "method": "chacha20-ietf-poly1305"
                    }
                ],
                "network": "tcp,udp"
            }
        },
        {
            "port": 17789,
            "protocol": "shadowsocks",
            "settings": {
                "clients": [
                    {
                        "password": "password",
                        "method": "chacha20-ietf-poly1305"
                    }
                ],
                "network": "tcp,udp"
            }
        }        
    ],
    "outbounds": [
        {
            "protocol": "freedom",
            "tag": "direct"
        }
    ]
}
```
#### 启动 xray
```
# 启动
systemctl start xray  或者 systemctl start xray@config #config json 文件名字
# 设置开机启动
systemctl enable xray 或者 systemctl start xray@config #config json 文件名字
# 查看启动状态
systemctl status xray 或者 systemctl start xray@config #config json 文件名字
```
#### 配置nginx 使用80 或者443 进行转发
```
# 使用cloudflare 进行转发 后端可以配置http 
http://cloudflare.com/
# 设置 cloudflare 网络选择 WebSocket ssl/tls 修改成灵活
# 安装 nginx
yum install nginx \ apt install nginx
# 配置nginx
cd /etc/nginx/
vim nginx.conf
user  root;
worker_processes  1; # 配置cpu 数量
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;
events {
    worker_connections 8192;
    use epoll;
}
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /var/log/nginx/access.log  main;
    sendfile        on;
    #tcp_nopush     on;
    keepalive_timeout  120;
    client_max_body_size 20m;
    #gzip  on;
   include /etc/nginx/conf.d/*.conf;
}
# 创建域名配置目录
mkdir conf.d
cd conf.d
# 创建 域名配置文件 这里用二级域名
ws 配置
vim xx.xxx.com.conf
map $http_upgrade $connection_upgrade {
            default upgrade;
            ''      close;
}
upstream ws {
        least_conn;
        server 127.0.0.1:9999 max_fails=3 fail_timeout=30s;
        keepalive 64;
                }

server {
    listen 80;
    server_name xx.xxx.com;
    location / {
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-NginX-Proxy true;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_ssl_session_reuse off;
      proxy_redirect     off;
      proxy_pass http://ws/;
    }

}
# https 配置
# 安装 免费自动签名工具
curl  https://get.acme.sh | sh

mkdir -p /apps/nginx/sslkey/tycng.com
 nginx ocsp配置
cd /apps/nginx/sslkey/tycng.com 
 openssl rand 48 > tlsb_session_ticket.key
 openssl  dhparam -out dhparam.pem 2048
 openssl rand 48 > tls_session_ticket.key
# 签发证书   
#letsencrypt 签发
acme.sh --issue  tycng.com -d *.tycng.com  --nginx -k 4096

# 复制证书到nginx 使用目录
acme.sh --install-cert -d gio.tycng.com  \
--key-file /apps/nginx/sslkey/tycng.com/private.key \
--ca-file /apps/nginx/sslkey/tycng.com/ca.crt \
--cert-file /apps/nginx/sslkey/tycng.com/cert.crt \
--fullchain-file /apps/nginx/sslkey/tycng.com/fullchain.crt
ecc 证书申请
acme.sh --issue  -d tycng.com -d *.tycng.com --dns dns_dp -k ec-256 

# 查看证书 ocsp_uri
openssl x509 -in fullchain.crt -noout -ocsp_uri

acme.sh --install-cert -d tycng.com  --ecc \
--key-file /apps/nginx/sslkey/tycng.com/eccprivate.key \
--ca-file /apps/nginx/sslkey/tycng.com/eccca.crt \
--cert-file /apps/nginx/sslkey/tycng.com/ecccert.crt \
--fullchain-file /apps/nginx/sslkey/tycng.com/ecccertificate.crt \
--reloadcmd "cd /apps/nginx/sslkey/tycng.com/;openssl ocsp -CAfile certificate.crt -issuer eccca.crt -cert ecccert.crt -no_nonce  \
-url  http://ocsp.int-x3.letsencrypt.org  -text -respout eccstapling_ocsp ;nginx -s reload"

# zerossl 签发
acme.sh --issue --nginx -d gio.tycng.com -d tycng.com -d ocezs.tycng.com -d trojan.tycng.com  -d kms.tycng.com -d dvns.tycng.com -m xxx@gmail.com  -k 4096
acme.sh --issue --nginx -d gio.tycng.com -d tycng.com -d ocezs.tycng.com -d trojan.tycng.com  -d kms.tycng.com -d dvns.tycng.com -m xxx@gmail.com  -k ec-256
acme.sh --install-cert -d gio.tycng.com  \
--key-file /apps/nginx/sslkey/tycng.com/private.key \
--ca-file /apps/nginx/sslkey/tycng.com/ca.crt \
--cert-file /apps/nginx/sslkey/tycng.com/cert.crt \
--fullchain-file /apps/nginx/sslkey/tycng.com/fullchain.crt


acme.sh --install-cert -d gio.tycng.com  \
 --ecc --key-file /apps/nginx/sslkey/tycng.com/ecc/private.key \
 --ca-file /apps/nginx/sslkey/tycng.com/ecc/ca.crt \
 --cert-file /apps/nginx/sslkey/tycng.com/ecc/cert.crt \
 --fullchain-file /apps/nginx/sslkey/tycng.com/ecc/fullchain.crt \
 --reloadcmd "cd /apps/nginx/sslkey/tycng.com/ecc/;openssl ocsp -CAfile fullchain.crt -issuer ca.crt -cert cert.crt -no_nonce \
 -url  http://zerossl.ocsp.sectigo.com  -text -respout stapling_ocsp ;nginx -s reload"
 
# nginx 配置参考
* [nginx 配置](./nginx)

# 启动
systemctl start nginx
# 设置开机启动
systemctl enable nginx
# 查看启动状态
systemctl status nginx

```
#### 客户端配置
* [客户端配置](../clash/README.md)