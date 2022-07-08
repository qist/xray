# clash 配置

## clash 客户端下载

```bash
https://github.com/Dreamacro/clash/releases/tag/premium

```

### dashboard 配置

```bash
# 下载 https://github.com/haishanh/yacd
创建dashboard目录跟config.yaml 同级 然后解压下载好的yacd.tar.xz 文件 
# 或者使用https://github.com/qist/v2ray/tree/main/clash/linux/dashboard
# clash 部署IP
# 访问http://ip:9090/ui/#/
```

### 配置文件

* [clash 配置文件](./config.yaml)
 
## 配置特别说明:

```bash
proxy-groups:
  - name: test
    type: select
    use: 
     - vmess  # 上面proxy-providers 没配置的名字请删除不然有些客户端报错
     - snell
     - trojan
     - ss
```

## windows 启动

```bash
# 下载 https://www.wintun.net/  # wintun.dll
# wintun.dll 放到-d 参数配置目录下面
H:\docker\tmp\clash-windows-amd64.exe -d H:\docker\tmp
# 可以使用nssm 创建服务启动 http://www.nssm.cc/download

```

## linux 启动 内核大于4.10

## linux 旁路方式局域网使用 部署IP 192.168.2.10

## 启动配置

* [clash linux](./clash.service)
  
## 挂载bpf驱动

* [clash bpf](./sys-fs-bpf.mount)  
  
```bash

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