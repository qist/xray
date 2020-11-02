# v2ray ws 模式安装

#### 下载 v2ray
```
mkdir -p /usr/local/v2ray

cd /usr/local/v2ray

wget https://github.com/v2fly/v2ray-core/releases/download/v4.32.0/v2ray-linux-64.zip

```
#### 解压 v2ray
```
unzip v2ray-linux-64.zip

```
#### 配置启动文件
```
### 方便 centos Ubuntu 使用
vim /etc/systemd/system/v2ray.service
[Unit]
Description=V2Ray Service
After=network.target
Wants=network.target

[Service]
# This service runs as root. You may consider to run it as another user for security concerns.
# By uncommenting the following two lines, this service will run as user v2ray/v2ray.
# More discussion at https://github.com/v2ray/v2ray-core/issues/1011
# User=v2ray
# Group=v2ray
Type=simple
PIDFile=/run/v2ray.pid
ExecStart=/usr/local/v2ray/v2ray -config /etc/v2ray/config.json
Restart=on-failure
# Don't restart in the case of configuration error
RestartPreventExitStatus=23

[Install]
WantedBy=multi-user.target
```
#### 配置 v2ray
```
v2 配置在线生成
https://intmainreturn0.com/v2ray-config-gen/

mkdir /etc/v2ray

vim /etc/v2ray/config.json
{
  "log" : {
    "access": "/var/log/v2ray/access.log",
    "error": "/var/log/v2ray/error.log",
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
            "id": "998272ec-6486-43ab-a450-86e6964be97f",
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
```
#### 启动 v2ray
```
# 启动
systemctl start v2ray
# 设置开机启动
systemctl enable v2ray
# 查看启动状态
systemctl status v2ray
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

# 启动
systemctl start nginx
# 设置开机启动
systemctl enable nginx
# 查看启动状态
systemctl status nginx
# https 配置
# 安装 免费自动签名工具
curl  https://get.acme.sh | sh
# 签发证书
acme.sh --issue  -d xx.xxx.com  --nginx -k 4096
# 复制证书到nginx 使用目录
mkdir -p /etc/nginx/ssl/xx.xxx.com
acme.sh --install-cert -d xx.xxx.com   \
        --key-file /etc/nginx/ssl/xx.xxx.com/private.key  \
        --fullchain-file /etc/nginx/ssl/xx.xxx.com/fullchain.cer  \
        --reloadcmd "systemctl reload nginx"
# nginx 配置
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
server {
    listen     443 ssl http2;
    server_name xx.xxx.com;
    client_max_body_size    0;
    chunked_transfer_encoding on;
    client_body_buffer_size 102400k;
    add_header Strict-Transport-Security "max-age=63072000; includeSubdomains; preload" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options "DENY";
    add_header X-via "Server v2.0";
    ssl_certificate /etc/nginx/ssl/xx.xxx.com/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/xx.xxx.com/private.key;
    keepalive_timeout 60;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_buffer_size 4k;
    ssl_ciphers "TLS13-AES-256-GCM-SHA384:TLS13-CHACHA20-POLY1305-SHA256:TLS13-AES-128-GCM-SHA256:TLS13-AES-128-CCM-8-SHA256:TLS13-AES-128-CCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:RSA-PSK-AES256-GCM-SHA384:DHE-PSK-AES256-GCM-SHA384:RSA-PSK-CHACHA20-POLY1305:DHE-PSK-CHACHA20-POLY1305:ECDHE-PSK-CHACHA20-POLY1305:AES256-GCM-SHA384:PSK-AES256-GCM-SHA384:PSK-CHACHA20-POLY1305:RSA-PSK-AES128-GCM-SHA256:DHE-PSK-AES128-GCM-SHA256:AES128-GCM-SHA256:PSK-AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256";
    ssl_prefer_server_ciphers on;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ecdh_curve secp384r1;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;
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
```
#### 客户端配置
* [客户端配置] (/clash/README.md)