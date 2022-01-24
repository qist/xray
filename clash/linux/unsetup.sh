#!/usr/bin/env bash

SELF=$(readlink -f "$0")
BASEDIR=$(dirname "$SELF")

. "$BASEDIR"/config.sh

ip route add default via "$TUN_ADDR" dev "$TUN_DEV"