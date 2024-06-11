修改Trojan_workers.js 
let Pswd = 'trojan'; 改成自己的密码
修改Vless_workers.js 
let userID = '3a633010-2cd8-4578-99fc-1486ad84806d'; 改成自己的id
Trojan 需要自己的域名支持不然不能访问
或者别的使用cf 的域名
Vless没域名可以访问 只能是http 端口 https 端口不能访问
端口(port)：6个https端口可任意选择(443、8443、2053、2083、2087、2096)
访问或者连接

xxx/userID 或者 xxx/Pswd


部署方式参考：https://peanut996.com/vless-on-cloudflare-workers/



可以使用https://github.com/XIU2/CloudflareSpeedTest 做ip 优选


