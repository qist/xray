# xray

## xray 支持  trojan trojan-go v2ray 相关协议 以后只维护xray

* [snell安装](./snell/README.md)
* [hysteria安装](./hysteria/README.md)
* [tuic安装](./tuic/README.md)
* [xray安装](./xray/README.md)

## 客户端安装

* [clash安装](./clash/README.md)
* [clash.meta安装](./clash.meta/README.md)

## 规则

```yaml
rule-providers:
  reject:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/reject.txt"
    path: ./profiles/rules/reject.yaml
    interval: 86400 

  rejectcidr:
    type: http
    behavior: ipcidr
    url: "https://rules.tycng.com/clash/Ruleset/rejectcidr.txt"
    path: ./profiles/rules/rejectcidr.yaml
    interval: 86400 

  icloud:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/icloudcn.txt"
    path: ./profiles/rules/icloudcn.yaml
    interval: 86400 

  apple:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/applecn.txt"
    path: ./profiles/rules/applecn.yaml
    interval: 86400 

  win-spy:
    type: http
    behavior: domain
    format: text
    url: "https://rules.tycng.com/clash/Ruleset/win-spy.txt"
    path: ./profiles/rules/win-spy.txt
    interval: 86400 

  win-update:
    type: http
    behavior: domain
    format: text
    url: "https://rules.tycng.com/clash/Ruleset/win-update.txt"
    path: ./profiles/rules/win-update.txt
    interval: 86400 

  win-extra:
    type: http
    behavior: domain
    format: text
    url: "https://rules.tycng.com/clash/Ruleset/win-extra.txt"
    path: ./profiles/rules/win-extra.txt
    interval: 86400 

  google:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/google.txt"
    path: ./profiles/rules/google.yaml
    interval: 86400 

  proxy:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/proxy.txt"
    path: ./profiles/rules/proxy.yaml
    interval: 86400 

  direct:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/direct.txt"
    path: ./profiles/rules/direct.yaml
    interval: 86400 

  private:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/private.txt"
    path: ./profiles/rules/private.yaml
    interval: 86400 

  privatecn:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/privatecn.txt"
    path: ./profiles/rules/privatecn.yaml
    interval: 86400 

  gfw:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/gfw.txt"
    path: ./profiles/rules/gfw.yaml
    interval: 86400 

  tld-not-cn:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/tld-not-cn.txt"
    path: ./profiles/rules/tld-not-cn.yaml
    interval: 86400 

  Foreignmedia:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/Foreignmedia.txt"
    interval: 86400 
    path: ./profiles/rules/Foreignmedia.yaml

  Netflix:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/Netflix.txt"
    interval: 86400 
    path: ./profiles/rules/Netflix.yaml

  telegramcidr:
    type: http
    behavior: ipcidr
    url: "https://rules.tycng.com/clash/Ruleset/telegramcidr.txt"
    path: ./profiles/rules/telegramcidr.yaml
    interval: 86400 

  proxy-ip-cidr:
    type: http
    behavior: ipcidr
    url: "https://rules.tycng.com/clash/Ruleset/proxy-ip-cidr.txt"
    path: ./profiles/rules/proxy-ip-cidr.yaml
    interval: 86400 

  lancidr:
    type: http
    behavior: ipcidr
    url: "https://rules.tycng.com/clash/Ruleset/lancidr.txt"
    path: ./profiles/rules/lancidr.yaml
    interval: 86400 

  applications:
    type: http
    behavior: classical
    url: "https://rules.tycng.com/clash/Ruleset/applications.txt"
    path: ./profiles/rules/applications.yaml
    interval: 86400 

  domain-proxy-cidr:
    type: http
    behavior: domain
    url: "https://rules.tycng.com/clash/Ruleset/domain-proxy-cidr.txt"
    path: ./profiles/rules/domain-proxy-cidr.yaml
    interval: 86400 

  ip-proxy-cidr:
    type: http
    behavior: ipcidr
    url: "https://rules.tycng.com/clash/Ruleset/ip-proxy-cidr.txt"
    path: ./profiles/rules/ip-proxy-cidr.yaml
    interval: 86400 

  allcidr:
    type: http
    behavior: ipcidr
    format: text
    url: "https://rules.tycng.com/clash/Ruleset/all_cn_cidr.txt"
    path: ./profiles/rules/all_cn_cidr.txt
    interval: 86400

  allipv6cidr:
    type: http
    behavior: ipcidr
    format: text
    url: "https://rules.tycng.com/clash/Ruleset/all_cn_ipv6.txt"
    path: ./profiles/rules/all_cn_ipv6.txt
    interval: 86400
```

```bash
nohup socat TCP4-LISTEN:80,reuseaddr,fork TCP4:192.168.3.99:80 >> socat.log 2>&1 &
nohup socat TCP4-LISTEN:443,reuseaddr,fork TCP4:192.168.3.99:443 >> socat.log 2>&1 &
nohup socat -T 600 UDP4-LISTEN:443,reuseaddr,fork UDP4:192.168.3.99:443 >> socat.log 2>&1 &
```
