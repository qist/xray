# Xray  安装

## 下载 Xray

```bash
mkdir -p /usr/local/xray

cd /usr/local/xray

打开下面url 选择新版本，然后点击下载

https://github.com/XTLS/Xray-core/releases

```

## 解压 Xray

```bash
unzip  下载对应版本名

```

## 配置启动文件

```bash
# 修改路径 ExecStart=/usr/local/xray/xray run  -confdir=/etc/xray

```

## 目录方式启动

* [xray 启动配置](./xray.service)

## 配置 xray

## xray 配置参考

* [xray 配置](./xray)

修改xray json 文件适合自己使用

```bash
v2 配置在线生成
https://intmainreturn0.com/v2ray-config-gen/
https://github.com/XTLS/Xray-examples

```

## 启动 xray

```bash
# 启动
systemctl start xray   
# 设置开机启动
systemctl enable xray 
# 查看启动状态
systemctl status xray 

```

## 配置nginx 使用80 或者443 进行转发

```bash
# 使用cloudflare 进行转发 后端可以配置http 
http://cloudflare.com/
# 设置 cloudflare 网络选择 WebSocket ssl/tls 修改成灵活
# 安装 nginx

# centos
yum install nginx 
# ubuntu
apt install nginx
```

## 安装 免费自动签名工具

```bash
curl  https://get.acme.sh | sh

mkdir -p /apps/nginx/sslkey/tycng.com

```

## nginx ocsp配置

```bash
cd /apps/nginx/sslkey/tycng.com 
 openssl rand 48 > tlsb_session_ticket.key
 openssl  dhparam -out dhparam.pem 2048
 openssl rand 48 > tls_session_ticket.key
 ```

## 签发证书

## letsencrypt 签发

```bash
acme.sh --issue  --nginx -d gio.tycng.com -d tycng.com -d ocezs.tycng.com -d trojan.tycng.com  -d kms.tycng.com -d dvns.tycng.com -k 4096

```

## 复制证书到nginx 使用目录

```bash
acme.sh --install-cert -d gio.tycng.com  \
--key-file /apps/nginx/sslkey/tycng.com/private.key \
--ca-file /apps/nginx/sslkey/tycng.com/ca.crt \
--cert-file /apps/nginx/sslkey/tycng.com/cert.crt \
--fullchain-file /apps/nginx/sslkey/tycng.com/fullchain.crt

```

ecc 证书申请

```bash
acme.sh --issue --nginx -d gio.tycng.com -d tycng.com -d ocezs.tycng.com -d trojan.tycng.com  -d kms.tycng.com -d dvns.tycng.com -k ec-256 

```

## 查看证书 ocsp_uri

```bash
openssl x509 -in fullchain.crt -noout -ocsp_uri
```

## 复制ECC证书到nginx 使用目录

```bash
acme.sh --install-cert -d tycng.com  --ecc \
--key-file /apps/nginx/sslkey/tycng.com/eccprivate.key \
--ca-file /apps/nginx/sslkey/tycng.com/eccca.crt \
--cert-file /apps/nginx/sslkey/tycng.com/ecccert.crt \
--fullchain-file /apps/nginx/sslkey/tycng.com/ecccertificate.crt \
--reloadcmd "cd /apps/nginx/sslkey/tycng.com/;openssl ocsp -CAfile certificate.crt -issuer eccca.crt -cert ecccert.crt -no_nonce  \
-url  http://ocsp.int-x3.letsencrypt.org  -text -respout eccstapling_ocsp ;nginx -s reload"

```

## zerossl 签发

```bash
acme.sh --issue --nginx -d gio.tycng.com -d tycng.com -d ocezs.tycng.com -d trojan.tycng.com  -d kms.tycng.com -d dvns.tycng.com -m xxx@gmail.com  -k 4096
# ECC
acme.sh --issue --nginx -d gio.tycng.com -d tycng.com -d ocezs.tycng.com -d trojan.tycng.com  -d kms.tycng.com -d dvns.tycng.com -m xxx@gmail.com  -k ec-256
```

## zerossl复制证书到nginx 使用目录

```bash
acme.sh --install-cert -d gio.tycng.com  \
--key-file /apps/nginx/sslkey/tycng.com/private.key \
--ca-file /apps/nginx/sslkey/tycng.com/ca.crt \
--cert-file /apps/nginx/sslkey/tycng.com/cert.crt \
--fullchain-file /apps/nginx/sslkey/tycng.com/fullchain.crt
```

## zerossl复制ECC证书到nginx 使用目录

```bash
acme.sh --install-cert -d gio.tycng.com  \
 --ecc --key-file /apps/nginx/sslkey/tycng.com/ecc/private.key \
 --ca-file /apps/nginx/sslkey/tycng.com/ecc/ca.crt \
 --cert-file /apps/nginx/sslkey/tycng.com/ecc/cert.crt \
 --fullchain-file /apps/nginx/sslkey/tycng.com/ecc/fullchain.crt \
 --reloadcmd "cd /apps/nginx/sslkey/tycng.com/ecc/;openssl ocsp -CAfile fullchain.crt -issuer ca.crt -cert cert.crt -no_nonce \
 -url  http://zerossl.ocsp.sectigo.com  -text -respout stapling_ocsp ;nginx -s reload"
```

## 启动

```bash
systemctl start nginx

```

## 设置开机启动

```bash
systemctl enable nginx
```

## 查看启动状态

```bash
systemctl status nginx

```

## nginx 配置参考

* [nginx 配置](./nginx)
  
## 国内跳板nginx配置

```nginx
# nginx.conf 配置
underscores_in_headers on;

upstream grpc {
        server xx.xxx.com:443;
        keepalive 20000;
}

    location /dzfg9lm24p0x {
        access_log  off;
        if ($content_type !~ "application/grpc") {
                return 404;
        }
        client_body_buffer_size 202400k;
        client_body_in_single_buffer on;
        client_max_body_size 0;
        client_body_timeout 24h;
        keepalive_timeout 24h;
        send_timeout 24h;
        keepalive_requests 4294967296;
        grpc_socket_keepalive on;
        grpc_intercept_errors on;
        grpc_set_header Host "xxx.com"; # 后端域名
        grpc_set_header X-Real-IP $remote_addr;
        grpc_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        grpc_read_timeout 24h;
        grpc_send_timeout 24h;
        grpc_pass grpcs://grpc;
    }
```

## 客户端配置

* [客户端配置](../clash/README.md)
