# waf
## nginx waf 
```sh
# 安装依赖
 yum install -y lua-devel 
 git clone https://github.com/openresty/luajit2.git
 cd luajit2
 make -j$(nproc) && make -j$(nproc) install
 ln -sf /usr/local/lib/libluajit-5.1.so.2 /lib64/libluajit-5.1.so.2
 cd ../
 wget https://www.kyne.com.au/~mark/software/download/lua-cjson-2.1.0.tar.gz
 tar -xzvf lua-cjson-2.1.0.tar.gz
 cd lua-cjson-2.1.0
 make -j$(nproc) && make -j$(nproc) install
 cd ../
 git clone https://github.com/diegonehab/luasocket.git
 cd luasocket
 make -j$(nproc) && make -j$(nproc) install
 export LUAJIT_LIB=/usr/local/lib
 export LUAJIT_INC=/usr/local/include/luajit-2.1
 cd ../
 git clone https://github.com/simplresty/ngx_devel_kit.git
 git clone https://github.com/openresty/lua-nginx-module.git
  # 下载nginx
 wget https://nginx.org/download/nginx-1.15.10.tar.gz
 tar -xvf nginx-1.15.10.tar.gz
 cd nginx-1.15.10
 ./configure --add-module=../lua-nginx-module \
            --add-module=../ngx_devel_kit 
```
