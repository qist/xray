#!/usr/bin/env bash

# TUN Interface
TUN_ADDR='198.19.0.1'
TUN_NET='198.19.0.0/16'
TUN_DEV='utun'

# MISC
CLASH_TABLE='0x164'
CLASH_USER='clash'
CLASH_UID=$(id -u "$CLASH_USER")
MAIN_TABLE='main'