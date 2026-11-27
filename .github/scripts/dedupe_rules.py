#!/usr/bin/env python3
"""规则文件保序去重。

做四件事，不改顺序、不改内容：
  1. 删除完全重复的后缀条目（同一条 `+.example.com` 出现多次）；
  2. 删除完全重复的精确条目（同一条 `example.com` 出现多次）；
  3. 删除已被同文件内后缀条目覆盖的精确条目（有 `+.example.com` 时，
     `example.com` 是冗余的；反之不成立，所以只按"后缀已存在"删精确）；
  4. 仅对 SUBSUMED_FILES 内的文件，额外删除已被**父级通配后缀**覆盖的条目：
     有 `+.google.com.uy` 时，`scholar.google.com.uy` 与 `+.scholar.google.com.uy`
     都不会再被匹配到，删掉不改变任何行为。

注释、空行、`payload:` 头原样保留；换行符（LF/CRLF）原样保留；
CIDR / PROCESS-NAME 等按原值比较。

用法：
    python3 .github/scripts/dedupe_rules.py            # 只统计，不落盘
    python3 .github/scripts/dedupe_rules.py --apply    # 就地去重
"""

import glob
import os
import sys

HEADERS = {"payload:", "rules:"}

# 父后缀覆盖去重只在"同一目标"的名单内部做：直连名单对直连名单、代理名单对
# 代理名单。不看跨文件（例如 gfw 与 proxy 有 4350 条交叉）——每个 ruleset 都是
# 独立发布的 URL，外部可能只引用其中一个，跨文件删除会让单独使用者漏规则。
SUBSUMED_FILES = {"proxy.txt", "gfw.txt", "direct.txt"}


def parse(line):
    """返回 (值, 是否后缀通配)；注释/空行/头返回 None。"""
    s = line.strip()
    if not s or s.startswith("#") or s in HEADERS:
        return None
    if s.startswith("-"):
        s = s[1:].strip()
    s = s.strip().strip("\"'")
    if not s:
        return None
    wildcard = s.startswith("+.")
    if wildcard:
        s = s[2:]
    return s.lower(), wildcard


def read_lines(path):
    """newline="" → 不做换行符转换，CRLF 文件不会被改成 LF。"""
    with open(path, encoding="utf-8", errors="ignore", newline="") as fh:
        return fh.readlines()


def has_parent_suffix(value, suffixes):
    """value 是否被某个父级后缀覆盖（不含自身）。"""
    parts = value.split(".")
    for i in range(1, len(parts)):
        if ".".join(parts[i:]) in suffixes:
            return True
    return False


def dedupe_lines(lines, drop_subsumed=False):
    """返回 (去重后的行, 删除行数)。"""
    parsed = [p for p in (parse(l) for l in lines) if p]
    suffixes = {v for v, w in parsed if w}
    eol = "\r\n" if any(l.endswith("\r\n") for l in lines) else "\n"

    out = []
    seen_suffix = set()
    seen_exact = set()
    removed = 0
    for line in lines:
        p = parse(line)
        if p:
            value, wildcard = p
            if drop_subsumed and has_parent_suffix(value, suffixes):
                removed += 1
                continue
            if wildcard:
                if value in seen_suffix:
                    removed += 1
                    continue
                seen_suffix.add(value)
            else:
                if value in seen_exact or value in suffixes:
                    removed += 1
                    continue
                seen_exact.add(value)
        out.append(line if line.endswith("\n") else line + eol)
    return out, removed


def main():
    apply = "--apply" in sys.argv[1:]
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    total = 0
    for path in sorted(glob.glob(os.path.join(root, "clash", "Ruleset", "*.txt"))):
        lines = read_lines(path)
        out, removed = dedupe_lines(lines, drop_subsumed=os.path.basename(path) in SUBSUMED_FILES)
        if apply and removed:
            with open(path, "w", encoding="utf-8", newline="") as fh:
                fh.writelines(out)
        if removed:
            total += removed
            print(f"{os.path.relpath(path, root)}: {removed}")
    print(f"TOTAL {total} (apply={apply})")


if __name__ == "__main__":
    main()
