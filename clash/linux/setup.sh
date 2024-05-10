#!/usr/bin/env bash
TUN_DEV='utun0'
#wait for TUN device
while ! ip address show "$TUN_DEV" > /dev/null; do
    sleep 0.2
done
ip rule add from 192.168.0.0/16 lookup main
ip rule add from 172.16.0.0/12 lookup main
ip rule add from 127.0.0.0/8 lookup main
ip rule add from 224.0.0.0/4 lookup main
ip rule add from 10.0.0.0/8 lookup main
