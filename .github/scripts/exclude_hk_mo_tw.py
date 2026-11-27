#!/usr/bin/env python3
"""从国内 IP 集里剔除港澳台（HK/MO/TW）地址段。

背景：`cncidr.txt`、`all_cn_cidr.txt`、`all_cn_ipv6.txt` 是"中国大陆"直连名单，
但上游数据里混进了少量登记在香港/澳门/台湾的网段（RIR 口径）。这些地址应该走
代理，不能出现在直连名单里，否则港澳台流量会被判成直连。

做法：按 `.github/data/regions/{hk,tw,mo}.txt` 与 `{hk,tw,mo}_ipv6.txt`
（与 all_cn 同一来源：ispip.clang.cn / IPNetDB）对三份名单做**网段相减**，
保留大陆部分。用同一数据源可以避免"登记地"与"实际归属"两套口径打架。相减后可能会把一个粗网段拆成几段
（例如 /14 被挖掉一个 /24），文件行数会略有变化，但语义严格等价于"大陆 - 港澳台"。

用法：
    python3 .github/scripts/exclude_hk_mo_tw.py            # 只统计
    python3 .github/scripts/exclude_hk_mo_tw.py --apply    # 就地改写

注释、`payload:` 头、引号风格、换行符（LF/CRLF）都按原文件保留。
"""

import bisect
import glob
import ipaddress
import os
import sys

# 需要处理的"中国大陆直连"名单（相对仓库根目录）。
TARGETS = [
    "clash/Ruleset/cncidr.txt",
    "clash/Ruleset/all_cn_cidr.txt",
    "clash/Ruleset/all_cn_ipv6.txt",
]

REGION_FILES = [
    "hk.txt",
    "tw.txt",
    "mo.txt",
    "hk_ipv6.txt",
    "tw_ipv6.txt",
    "mo_ipv6.txt",
]


def repo_root():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_exclusions(root):
    """返回 {4: [(start,end,net)], 6: [...]}，按起始地址排序。"""
    out = {4: [], 6: []}
    for name in REGION_FILES:
        path = os.path.join(root, ".github", "data", "regions", name)
        with open(path, encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                s = line.strip()
                if not s or s.startswith("#"):
                    continue
                try:
                    net = ipaddress.ip_network(s, strict=False)
                except ValueError:
                    continue
                out[net.version].append(net)
    for ver in out:
        merged = list(ipaddress.collapse_addresses(out[ver])) if out[ver] else []
        out[ver] = sorted(
            ((int(n.network_address), int(n.broadcast_address), n) for n in merged)
        )
    return out


def parse_line(line):
    """返回 (prefixlen 前的原始写法信息, net) 或 None。

    支持两种现有格式：
        payload: + "  - '1.0.1.0/24'"
        纯文本 "1.2.4.0/24"
    """
    s = line.strip()
    if not s or s.startswith("#") or s == "payload:":
        return None
    raw = s
    if s.startswith("-"):
        s = s[1:].strip()
    s = s.strip().strip("\"'")
    try:
        net = ipaddress.ip_network(s, strict=False)
    except ValueError:
        return None
    return raw, net


def subtract(net, ex, ends):
    """从 net 中减去与它相交的排除网段，返回有序的剩余网段列表。

    ex 按起始地址排序且互不相交，所以 ends 也是升序：用 ends 二分定位
    第一个"结束地址 >= net 起始地址"的排除段，避免漏掉起始很早但范围很大
    的父级网段（例如 63.128.0.0/12 覆盖 63.140.0.0/24）。
    """
    pieces = [net]
    i = bisect.bisect_left(ends, int(net.network_address))
    while i < len(ex) and ex[i][0] <= int(net.broadcast_address):
        block = ex[i][2]
        if ex[i][1] >= int(net.network_address) and net.version == block.version:
            nxt = []
            for p in pieces:
                if p.overlaps(block):
                    try:
                        nxt.extend(p.address_exclude(block))
                    except ValueError:
                        # block 是 p 的父网段 → p 整段都在港澳台范围内，直接丢弃
                        pass
                else:
                    nxt.append(p)
            pieces = nxt
        i += 1
    return sorted(pieces, key=lambda n: int(n.network_address))


def process(path, ex):
    """返回 (新的行列表, 移除地址数, 新增段数)。"""
    with open(path, encoding="utf-8", errors="ignore", newline="") as fh:
        lines = fh.readlines()
    eol = "\r\n" if any(l.endswith("\r\n") for l in lines) else "\n"

    payload_style = any(l.strip() == "payload:" for l in lines)
    ends_by_ver = {v: [b[1] for b in (blocks or [])] for v, blocks in ex.items()}
    out, removed, added = [], 0, 0
    for line in lines:
        parsed = parse_line(line)
        if not parsed:
            out.append(line if line.endswith("\n") else line + eol)
            continue
        raw, net = parsed
        blocked = ex.get(net.version) or []
        pieces = subtract(net, blocked, ends_by_ver[net.version]) if blocked else [net]
        if len(pieces) == 1 and pieces[0] == net:
            out.append(line if line.endswith("\n") else line + eol)
            continue
        removed += net.num_addresses - sum(p.num_addresses for p in pieces)
        added += len(pieces) - 1
        for p in pieces:
            if payload_style:
                out.append(f"  - '{p.with_prefixlen}'{eol}")
            else:
                out.append(f"{p.with_prefixlen}{eol}")
    return out, removed, added, payload_style


def main():
    apply = "--apply" in sys.argv[1:]
    root = repo_root()
    ex = load_exclusions(root)
    print(
        f"排除清单: HK/MO/TW v4 {len(ex[4])} 段, v6 {len(ex[6])} 段"
    )
    total_removed = 0
    for rel in TARGETS:
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            continue
        out, removed, added, _ = process(path, ex)
        total_removed += removed
        if removed or added:
            print(f"{rel}: 移除 {removed:,} 个地址, 段数 +{added}")
            if apply:
                with open(path, "w", encoding="utf-8", newline="") as fh:
                    fh.writelines(out)
    print(f"TOTAL removed addresses: {total_removed:,} (apply={apply})")


if __name__ == "__main__":
    main()
