#!/bin/sh

openssl ocsp -no_nonce \
             -CAfile /apps/nginx/sslkey/tycng.com/ecc/fullchain.crt \
             -issuer /apps/nginx/sslkey/tycng.com/ecc/ca.crt \
             -cert /apps/nginx/sslkey/tycng.com/ecc/cert.crt \
             -respout /apps/nginx/sslkey/tycng.com/ecc/stapling_ocsp \
             -url "$(openssl x509 -in /apps/nginx/sslkey/tycng.com/ecc/fullchain.crt -text | grep "OCSP - URI:" | cut -d: -f2,3)" \
             > /tmp/ocsp.reply 2>&1

at $(date -d "$(cat /tmp/ocsp.reply | grep 'Next Update: ' | awk -F': ' '{print $2}') + 1 minutes" +"%H:%M %Y-%m-%d") < /apps/nginx/ocsp.cron.sh

nginx -s reload

exit
