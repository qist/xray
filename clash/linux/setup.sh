#!/usr/bin/env bash

#file: setup.sh

SELF=$(readlink -f "$0")
BASEDIR=$(dirname "$SELF")

. "$BASEDIR"/config.sh

#wait for TUN device
while ! ip address show "$TUN_DEV" > /dev/null; do
    sleep 0.2
done

ip route add default via "$TUN_ADDR" dev "$TUN_DEV"