#!/usr/bin/env bash

#file: setup.sh

SELF=$(readlink -f "$0")
BASEDIR=$(dirname "$SELF")

. "$BASEDIR"/config.sh

#wait for TUN device
while ! ip address show "$TUN_DEV" > /dev/null; do
    sleep 0.2
done

ip route flush table "$CLASH_TABLE"
ip route add default via "$TUN_ADDR" dev "$TUN_DEV" table "$CLASH_TABLE"
ip route add "$TUN_NET" dev "$TUN_DEV" table "$CLASH_TABLE"
ip rule add from all table "$CLASH_TABLE"
ip rule add to 192.168.0.0/16 table "$MAIN_TABLE"
ip rule add to 172.16.0.0/12 table "$MAIN_TABLE"
ip rule add to 127.0.0.0/8 table "$MAIN_TABLE"
ip rule add to 224.0.0.0/4 table "$MAIN_TABLE"
ip rule add to 10.0.0.0/8 table "$MAIN_TABLE"
ip rule add to "$TUN_NET" table "$MAIN_TABLE"
ip rule add uidrange "${CLASH_UID}-${CLASH_UID}" table "$MAIN_TABLE"