#!/usr/bin/env bash

SELF=$(readlink -f "$0")
BASEDIR=$(dirname "$SELF")

. "$BASEDIR"/config.sh

ip rule delete from all table "$CLASH_TABLE"
ip rule delete uidrange "${CLASH_UID}-${CLASH_UID}" table "$MAIN_TABLE"
ip rule delete to 192.168.0.0/16 table "$MAIN_TABLE"
ip rule delete to 172.16.0.0/12 table "$MAIN_TABLE"
ip rule delete to 10.0.0.0/8 table "$MAIN_TABLE"
ip rule delete to 127.0.0.0/8 table "$MAIN_TABLE"
ip rule delete to 224.0.0.0/4 table "$MAIN_TABLE"
ip rule delete to "$TUN_NET" table "$MAIN_TABLE"
ip route flush table "$CLASH_TABLE"