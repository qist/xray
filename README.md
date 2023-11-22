# xray

## xray 支持  trojan trojan-go v2ray 相关协议 以后只维护xray

* [snell安装](./snell/README.md)
* [hysteria安装](./hysteria/README.md)
* [tuic安装](./tuic/README.md)
* [xray安装](./xray/README.md)

## 客户端安装

* [clash安装](./clash/README.md)
* [clash.meta安装](./clash.meta/README.md)

nohup socat TCP4-LISTEN:80,reuseaddr,fork TCP4:192.168.3.99:80 >> socat.log 2>&1 &
nohup socat TCP4-LISTEN:443,reuseaddr,fork TCP4:192.168.3.99:443 >> socat.log 2>&1 &
nohup socat -T 600 UDP4-LISTEN:443,reuseaddr,fork UDP4:192.168.3.99:443 >> socat.log 2>&1 &
