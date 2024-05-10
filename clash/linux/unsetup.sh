#!/usr/bin/env bash
ip rule delete from 192.168.0.0/16 lookup main
ip rule delete from 172.16.0.0/12 lookup main
ip rule delete from 127.0.0.0/8 lookup main
ip rule delete from 224.0.0.0/4 lookup main
ip rule delete from 10.0.0.0/8 lookup main
