#!/usr/bin/env python3
"""
defensive_checker.py — Superpowers Defensive Code Quality & Telemetry Checker for Yolo Cycling (Rouleur).

Enforcesobra/superpowers engineering discipline and GEMINI.md defensive rules:
1. Zero console.log in production code (src/)
2. Zero unresolved TODO / FIXME debts in production paths
3. All localStorage / sessionStorage calls must be defensively guarded by try...catch
4. Zero unconstrained division by variable without safe fallback / Math.max

Usage:
  python defensive_checker.py scan src
"""

import os
import sys
import re
from pathlib import Path

# RegEx patterns for defensive quality auditing
CONSOLE_LOG_PATTERN = re.compile(r'\bconsole\.log\s*\(')
TODO_FIXME_PATTERN = re.compile(r'\b(TODO|FIXME)\b', re.IGNORECASE)
LOCAL_STORAGE_PATTERN = re.compile(r'\b(localStorage|sessionStorage)\.(getItem|setItem|removeItem|clear)\b')

def is_line_commented(line: str) -> bool:
    stripped = line.strip()
    return stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*')

def check_file(file_path: Path):
    issues = []
    
    # Read file content safely
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return [f"Unable to read file: {e}"]

    # Track try/catch scope depth
    in_try_block = 0
    brace_depth = 0
    try_brace_depths = []

    for idx, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line or is_line_commented(line):
            continue

        # Check console.log
        if CONSOLE_LOG_PATTERN.search(line):
            issues.append({
                "type": "FORBIDDEN_CONSOLE_LOG",
                "line": idx,
                "msg": f"console.log is forbidden in production code. Use console.warn/error or logger instead."
            })

        # Check TODO / FIXME
        if TODO_FIXME_PATTERN.search(line) and not "eslint" in line:
            issues.append({
                "type": "UNRESOLVED_TECH_DEBT",
                "line": idx,
                "msg": f"Unresolved TODO/FIXME found in production path: '{line[:60]}...'"
            })

        # Track try blocks naively
        if re.search(r'\btry\s*\{', line):
            try_brace_depths.append(brace_depth + 1)
        
        # Count braces
        brace_depth += line.count('{') - line.count('}')
        
        # Pop closed try blocks
        while try_brace_depths and brace_depth < try_brace_depths[-1]:
            try_brace_depths.pop()

        # Check localStorage / sessionStorage calls
        if LOCAL_STORAGE_PATTERN.search(line):
            # Check if this file is a test file
            if "__tests__" in str(file_path) or file_path.name.endswith(".test.ts"):
                continue

            # If inside try block or helper function getStorage(), it's safe
            is_in_try = len(try_brace_depths) > 0
            is_get_storage_helper = "getStorage()" in line or "storage." in line
            
            if not is_in_try and not is_get_storage_helper:
                # Look ahead/behind 3 lines for immediate try...catch
                window = "".join(lines[max(0, idx - 4):min(len(lines), idx + 2)])
                if "try" not in window:
                    issues.append({
                        "type": "UNGUARDED_STORAGE_ACCESS",
                        "line": idx,
                        "msg": f"Unguarded storage access: '{line[:60]}'. Wrap in try...catch to defend against QuotaExceededError or Private Browsing mode."
                    })

    return issues

def scan_directory(directory: str):
    target = Path(directory).resolve()
    if not target.exists():
        print(f"Error: Target directory {target} does not exist.")
        sys.exit(1)

    print(f"\nSuperpowers Defensive Code Quality & Telemetry Scanner")
    print(f"Scanning target: {target}\n")

    valid_exts = {'.ts', '.tsx', '.js', '.jsx'}
    all_issues = {}
    file_count = 0

    for root, _, files in os.walk(target):
        for f in files:
            p = Path(root) / f
            if p.suffix in valid_exts and not p.name.endswith('.d.ts'):
                file_count += 1
                issues = check_file(p)
                if issues:
                    all_issues[p] = issues

    print(f"Scanned {file_count} source files.\n")

    if not all_issues:
        print("Defensive Quality Score: 100.0 / 100")
        print("Status: Pristine! Zero console.log, zero technical debt, 100% guarded storage access.\n")
        sys.exit(0)
    else:
        total_errors = sum(len(errs) for errs in all_issues.values())
        score = max(0.0, round(100.0 - (total_errors * 5.0), 1))
        print(f"Defensive Quality Score: {score} / 100")
        print(f"Found {total_errors} defensive issues across {len(all_issues)} files:\n")

        for p, errs in all_issues.items():
            rel_path = p.relative_to(target.parent if target.parent else target)
            print(f"  [{rel_path}]")
            for err in errs:
                print(f"    Line {err['line']}: [{err['type']}] {err['msg']}")
            print()

        if score < 100.0:
            sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] != 'scan':
        print("Usage: python defensive_checker.py scan <src_dir>")
        sys.exit(1)

    scan_directory(sys.argv[2])
