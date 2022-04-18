# clash 配置

### clash 客户端下载
```
https://github.com/Dreamacro/clash/releases/tag/premium
```
### dashboard 配置
```
# 下载 https://github.com/haishanh/yacd
创建dashboard目录跟config.yaml 同级 然后解压下载好的yacd.tar.xz 文件 
# 或者使用https://github.com/qist/v2ray/tree/main/clash/linux/dashboard
[root@control-plane]# tree  dashboard/
dashboard/
├── apple-touch-icon-precomposed.png
├── assets
│   ├── Chart.min.44f6c6c6.js
│   ├── Config.029b666f.js
│   ├── Config.af7c0f33.css
│   ├── Connections.52bc9670.js
│   ├── Connections.9de0e2a6.css
│   ├── debounce.76599460.js
│   ├── en.f1dd5536.js
│   ├── Fab.200e0680.css
│   ├── Fab.4dc9cb99.js
│   ├── index.9233837d.js
│   ├── index.a628dc5e.css
│   ├── index.ee5bc09a.js
│   ├── index.esm.edbe839b.js
│   ├── index.fe1062b5.js
│   ├── Logs.01e28256.js
│   ├── logs.4dcb9935.js
│   ├── Logs.8b54b7be.css
│   ├── open-sans-latin-400-normal.cce57747.woff2
│   ├── open-sans-latin-400-normal.d7410996.woff
│   ├── open-sans-latin-700-normal.a61d6725.woff2
│   ├── open-sans-latin-700-normal.b1fda8d8.woff
│   ├── Proxies.71af777a.js
│   ├── Proxies.831754de.css
│   ├── roboto-mono-latin-400-normal.2dfc0e86.woff
│   ├── roboto-mono-latin-400-normal.e1fd013a.woff2
│   ├── Rules.a609ca62.css
│   ├── Rules.b2ac0faa.js
│   ├── Select.29a5a6ae.js
│   ├── Select.9a98fc65.css
│   ├── TextFitler.00e03ee5.css
│   ├── TextFitler.cc7f7fa3.js
│   ├── useRemainingViewPortHeight.7baef998.js
│   ├── vendor.38e754a4.js
│   └── zh.247ad8fa.js
├── CNAME
├── _headers
├── index.html
├── manifest.webmanifest
├── registerSW.js
├── sw.js
├── yacd-128.png
├── yacd-64.png
└── yacd.ico

1 directory, 44 files

# clash 部署IP
# 访问http://ip:9090/ui/#/
```

### 配置文件

 * [clash 配置文件](./config.yaml)
 
# 配置特别说明：
```
proxy-groups:
  - name: test
    type: select
    use: 
     - vmess  # 上面proxy-providers 没配置的名字请删除不然有些客户端报错
     - snell
     - trojan
     - ss
```
# windows 启动
```
# 下载 https://www.wintun.net/  # wintun.dll
# wintun.dll 放到-d 参数配置目录下面
H:\docker\tmp\clash-windows-amd64.exe -d H:\docker\tmp
# 可以使用nssm 创建服务启动 http://www.nssm.cc/download
```
# linux 启动
# linux 旁路方式局域网使用 部署IP 192.168.2.10
# 创建用户  clash
 useradd clash -s /sbin/nologin -M
 * [clash linux](./clash.service)
```

sysctl -w net.ipv4.ip_forward=1
或者编辑/etc/sysctl.conf
net.ipv4.ip_forward=1
sysctl -p
# 192.168.2.10 dns 解析改成127.0.0.1 这样可以基于域名进行分流
192.168.2.2 设置
# 删除默认路由
route delete default gw 192.168.2.1 
# 创建默认路由
route add default gw 192.168.2.10
# 修改dns 为 192.168.2.10
#如果固定请修改网卡配置
```
# 

内核低于4
使用脚本模式启动
# 授权 clash-linux-amd64 root 用户启动
```
[Unit]
Description=A rule based proxy tunnel
After=network-online.target

[Service]
Type=simple
NoNewPrivileges=true
User=root
Group=root
ExecStart=/usr/local/bin/clash-linux-amd64 -d /usr/local/clash
LimitCORE=infinity
LimitNOFILE=102400
LimitNPROC=102400
#StandardOutput=append:/var/log/clash.log
[Install]
WantedBy=multi-user.target
```
