#!/usr/bin/env python3
"""
Apple Human Interface Guidelines (HIG) Automated Compliance Checker
Dual-Platform: macOS Sequoia (Desktop) + iOS 18 (Mobile)

Zero external dependencies - standard library only.
Usage:
    python hig_checker.py contrast <fg_hex> <bg_hex>
    python hig_checker.py target <width_pt> <height_pt>
    python hig_checker.py scan [src_path]
"""

import sys
import os
import re
import argparse
from pathlib import Path

# ANSI colors for terminal output
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
BLUE = "\033[34m"
CYAN = "\033[36m"
GRAY = "\033[90m"

# Minimum touch target size according to Apple HIG (points)
MIN_TOUCH_TARGET = 44.0


# ---------------------------------------------------------------------------
# 1. WCAG 2.1 Color Contrast Checker
# ---------------------------------------------------------------------------

def parse_hex_color(hex_str: str):
    """Normalize hex string to (r, g, b) float tuple in [0.0, 1.0]."""
    clean = hex_str.strip().lstrip("#")
    if len(clean) == 3:
        clean = "".join([c * 2 for c in clean])
    if len(clean) != 6:
        raise ValueError(f"Invalid hex color format: '{hex_str}'. Expected 3 or 6 hex digits.")
    r = int(clean[0:2], 16) / 255.0
    g = int(clean[2:4], 16) / 255.0
    b = int(clean[4:6], 16) / 255.0
    return r, g, b


def channel_to_linear(c: float) -> float:
    """Convert sRGB channel [0..1] to linear light."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(r: float, g: float, b: float) -> float:
    """Calculate WCAG relative luminance."""
    return 0.2126 * channel_to_linear(r) + 0.7152 * channel_to_linear(g) + 0.0722 * channel_to_linear(b)


def contrast_ratio(hex_fg: str, hex_bg: str) -> float:
    """Calculate contrast ratio between foreground and background."""
    r1, g1, b1 = parse_hex_color(hex_fg)
    r2, g2, b2 = parse_hex_color(hex_bg)
    l1 = relative_luminance(r1, g1, b1)
    l2 = relative_luminance(r2, g2, b2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def run_contrast_check(fg: str, bg: str):
    try:
        ratio = contrast_ratio(fg, bg)
    except ValueError as e:
        print(f"{RED}Error:{RESET} {e}")
        return 1

    print(f"\n{BOLD}Apple HIG / WCAG 2.1 Contrast Ratio Verification{RESET}")
    print(f"Foreground: {CYAN}{fg}{RESET}  |  Background: {CYAN}{bg}{RESET}")
    print(f"Calculated Ratio: {BOLD}{ratio:.2f} : 1{RESET}\n")

    checks = [
        ("WCAG AA Normal Text (>= 4.5:1)", ratio >= 4.5),
        ("WCAG AA Large Text / UI Components (>= 3.0:1)", ratio >= 3.0),
        ("WCAG AAA Normal Text (>= 7.0:1)", ratio >= 7.0),
        ("WCAG AAA Large Text (>= 4.5:1)", ratio >= 4.5),
    ]

    aa_normal = ratio >= 4.5
    aa_ui = ratio >= 3.0

    for label, passed in checks:
        icon = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
        print(f"  [{icon}] {label}")

    print()
    if aa_normal:
        print(f"{GREEN}{BOLD}Result: Full AA Compliance{RESET} - Meets Apple HIG accessibility guidelines for body text.")
        return 0
    elif aa_ui:
        print(f"{GREEN}{BOLD}Result: UI Component Compliance{RESET} - Meets Apple HIG guidelines for buttons, icons and large text (>=3.0:1).")
        return 0
    else:
        print(f"{YELLOW}{BOLD}Result: Low Contrast{RESET} - Contrast ratio is below 3.0:1.")
        return 1


# ---------------------------------------------------------------------------
# 2. Touch Target Validator
# ---------------------------------------------------------------------------

def run_target_check(width: float, height: float):
    print(f"\n{BOLD}Apple HIG Touch Target Validator{RESET}")
    print(f"Input dimensions: {width:.1f} pt x {height:.1f} pt")
    print(f"Minimum required: {MIN_TOUCH_TARGET} pt x {MIN_TOUCH_TARGET} pt\n")

    w_ok = width >= MIN_TOUCH_TARGET
    h_ok = height >= MIN_TOUCH_TARGET

    w_icon = f"{GREEN}PASS{RESET}" if w_ok else f"{RED}FAIL{RESET}"
    h_icon = f"{GREEN}PASS{RESET}" if h_ok else f"{RED}FAIL{RESET}"

    print(f"  Width  ({width}pt):  [{w_icon}]")
    print(f"  Height ({height}pt): [{h_icon}]")

    print()
    if w_ok and h_ok:
        print(f"{GREEN}{BOLD}Result: Compliant{RESET} - Meets Apple HIG minimum 44x44pt touch boundary.")
        return 0
    else:
        print(f"{RED}{BOLD}Result: Non-compliant{RESET} - Touch target is too small for mobile touch ergonomics.")
        print(f"{GRAY}Recommendation: Apply Tailwind utility `min-h-[44px] min-w-[44px]` or increase padding (`p-2.5`).{RESET}")
        return 1


# ---------------------------------------------------------------------------
# 3. Static Codebase Scanner
# ---------------------------------------------------------------------------

class HIGViolation:
    def __init__(self, file_path: str, line_no: int, rule_id: str, severity: str, message: str, snippet: str = ""):
        self.file_path = file_path
        self.line_no = line_no
        self.rule_id = rule_id
        self.severity = severity  # "ERROR", "WARNING", "INFO"
        self.message = message
        self.snippet = snippet.strip()


def scan_file(file_path: Path) -> list:
    violations = []
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return violations

    lines = content.splitlines()

    for idx, line in enumerate(lines, 1):
        # Skip pure comments
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue

        # 1. Generic Tailwind shadows (Anti-pattern: shadow-md, shadow-lg, shadow-xl)
        # Exclude shadow-ios-* and shadow-none, shadow-sm, shadow-inner if inside quotes
        generic_shadow_match = re.search(r'\b(shadow-(?:md|lg|xl|2xl))\b', line)
        if generic_shadow_match and "shadow-ios-" not in line:
            violations.append(HIGViolation(
                str(file_path), idx, "SHADOW_TOKEN", "WARNING",
                f"Generic Tailwind shadow '{generic_shadow_match.group(1)}' used. Replace with Apple HIG tokens ('shadow-ios-card', 'shadow-ios-popover', 'shadow-ios-sm').",
                line
            ))

        # 2. Card border radius violation (Anti-pattern: rounded-3xl on regular cards)
        if "rounded-3xl" in line and not ("IOSCard" in line or "modal" in line.lower() or "sheet" in line.lower()):
            violations.append(HIGViolation(
                str(file_path), idx, "CARD_RADIUS", "WARNING",
                "Excessive radius 'rounded-3xl' found. Apple HIG card standard is 'rounded-2xl' (16px).",
                line
            ))

        # 3. Font weight overload (Anti-pattern: font-extrabold or font-black)
        font_heavy_match = re.search(r'\b(font-(?:extrabold|black))\b', line)
        if font_heavy_match:
            violations.append(HIGViolation(
                str(file_path), idx, "TYPO_WEIGHT", "ERROR",
                f"Forbidden font weight '{font_heavy_match.group(1)}'. Apple HIG max weight is 'font-bold'.",
                line
            ))

        # 4. Raw Hex in className (Anti-pattern: text-[#...] or bg-[#...] instead of tokens)
        # Allow canonical Apple system dark surfaces, macOS window controls, and official Strava brand colors
        ALLOWED_HEX = {
            "1C1C1E", "2C2C2E", "000000", "FFFFFF",  # Base Apple dark/light surfaces
            "121214", "161618", "1E1E22", "252528", "3A3A3C", "F2F2F7",  # Apple System Grays 1-6 & macOS dark panels
            "FF5F56", "FFBD2E", "27C93F", "E0443E", "DEA123", "1AAB29",  # macOS window traffic lights & hover
            "FC4C02", "E04300", "E34402",  # Official Strava brand orange & hover states
        }
        raw_hex_matches = re.finditer(r'(?:bg|text|border)-\[#([0-9a-fA-F]{3,8})\]', line)
        for m in raw_hex_matches:
            hex_val = m.group(1).upper()
            if hex_val not in ALLOWED_HEX:
                violations.append(HIGViolation(
                    str(file_path), idx, "COLOR_TOKEN", "WARNING",
                    f"Raw hex color '[#{hex_val}]' in className. Use semantic tokens (e.g. 'text-ios-blue', 'bg-ios-red/10').",
                    line
                ))

        # 5. Outdated button height (Anti-pattern: h-8.5 lingering from legacy code)
        if re.search(r'\bh-8\.5\b', line):
            violations.append(HIGViolation(
                str(file_path), idx, "CONTROL_HEIGHT", "WARNING",
                "Found legacy 'h-8.5'. Apple HIG control height is unified to 'h-9' (36px).",
                line
            ))

        # 6. Interactive element missing apple-touch
        if "<button" in line and "className=" in line and "apple-touch" not in line:
            lookahead = " ".join(lines[idx-1:min(len(lines), idx+3)])
            if "apple-touch" not in lookahead:
                violations.append(HIGViolation(
                    str(file_path), idx, "TOUCH_FEEDBACK", "INFO",
                    "Button missing 'apple-touch' class for iOS tactile scale-down feedback.",
                    line
                ))

        # 7. Card / Surface excessive padding (Anti-pattern: p-6, p-8 on standard cards)
        # Exclude hero sections or full-page wrappers with sm:p-6 or max-w constraints
        pad_match = re.search(r'\b(p-[6-9]|p-1[0-6])\b', line)
        if pad_match and not ("px-" in line or "py-" in line or "max-w" in line or "min-h-screen" in line):
            if "card" in line.lower() or "rounded-2xl" in line or "IOSCard" in line:
                violations.append(HIGViolation(
                    str(file_path), idx, "SPACING_DENSITY", "WARNING",
                    f"Excessive card padding '{pad_match.group(1)}'. Apple HIG card standard is 'p-4 sm:p-5'.",
                    line
                ))

        # 8. Numeric metric missing tabular-nums
        # Checks text-2xl/text-3xl metric displays that lack tabular-nums
        if re.search(r'\btext-(?:2xl|3xl|4xl)\b', line) and "font-mono" in line and "tabular-nums" not in line:
            violations.append(HIGViolation(
                str(file_path), idx, "NUMERIC_TABULAR", "WARNING",
                "Large numeric display uses 'font-mono' but is missing 'tabular-nums' to prevent layout jitter.",
                line
            ))

    return violations


def run_codebase_scan(src_dir: str):
    root_path = Path(src_dir)
    if not root_path.exists():
        print(f"{RED}Error:{RESET} Directory '{src_dir}' does not exist.")
        return 1

    print(f"\n{BOLD}Apple HIG Codebase Compliance Scanner{RESET}")
    print(f"Scanning target: {CYAN}{root_path.resolve()}{RESET}\n")

    extensions = (".tsx", ".ts", ".jsx", ".js")
    all_violations = []
    file_count = 0

    for ext in extensions:
        for file_path in root_path.rglob(f"*{ext}"):
            # Skip node_modules and build dist
            if "node_modules" in file_path.parts or "dist" in file_path.parts:
                continue
            file_count += 1
            v_list = scan_file(file_path)
            all_violations.extend(v_list)

    # Group by severity
    errors = [v for v in all_violations if v.severity == "ERROR"]
    warnings = [v for v in all_violations if v.severity == "WARNING"]
    infos = [v for v in all_violations if v.severity == "INFO"]

    # Calculate HIG Score (100 base, -5 per error, -2 per warning, -0.5 per info)
    deductions = (len(errors) * 5) + (len(warnings) * 2) + (len(infos) * 0.5)
    hig_score = max(0.0, min(100.0, 100.0 - deductions))

    print(f"Scanned {BOLD}{file_count}{RESET} source files.\n")

    if all_violations:
        print(f"{BOLD}Violations Breakdown:{RESET}")
        print(f"  {RED}Errors:{RESET}   {len(errors)}")
        print(f"  {YELLOW}Warnings:{RESET} {len(warnings)}")
        print(f"  {BLUE}Notices:{RESET}  {len(infos)}\n")

        # Group by file and show top findings
        files_with_issues = {}
        for v in all_violations:
            files_with_issues.setdefault(v.file_path, []).append(v)

        for f_path, issues in sorted(files_with_issues.items(), key=lambda item: len(item[1]), reverse=True):
            rel_path = os.path.relpath(f_path, str(root_path))
            print(f"{BOLD}{rel_path}{RESET} ({len(issues)} findings)")
            for issue in issues[:3]:  # show up to 3 per file
                color = RED if issue.severity == "ERROR" else (YELLOW if issue.severity == "WARNING" else GRAY)
                print(f"  Line {issue.line_no}: [{color}{issue.rule_id}{RESET}] {issue.message}")
            if len(issues) > 3:
                print(f"  {GRAY}... and {len(issues) - 3} more{RESET}")
            print()

    # Scorecard
    score_color = GREEN if hig_score >= 90 else (YELLOW if hig_score >= 75 else RED)
    print(f"{BOLD}Apple HIG Compliance Score:{RESET} {score_color}{hig_score:.1f} / 100{RESET}")

    if hig_score >= 90:
        print(f"{GREEN}Status: Excellent! Architecture is well-aligned with Apple HIG standards.{RESET}\n")
        return 0
    elif hig_score >= 75:
        print(f"{YELLOW}Status: Good, with minor remediations needed.{RESET}\n")
        return 0
    else:
        print(f"{RED}Status: Remediation required. Please address high-severity errors.{RESET}\n")
        return 1


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Apple Human Interface Guidelines (HIG) Compliance Checker",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # contrast subcommand
    p_contrast = subparsers.add_parser("contrast", help="Verify WCAG 2.1 color contrast ratio")
    p_contrast.add_argument("fg", help="Foreground hex color (e.g. '#007AFF' or '007AFF')")
    p_contrast.add_argument("bg", help="Background hex color (e.g. '#FFFFFF' or 'FFFFFF')")

    # target subcommand
    p_target = subparsers.add_parser("target", help="Validate touch target size against 44x44pt minimum")
    p_target.add_argument("width", type=float, help="Target width in points")
    p_target.add_argument("height", type=float, help="Target height in points")

    # scan subcommand
    p_scan = subparsers.add_parser("scan", help="Scan source code for HIG anti-patterns")
    p_scan.add_argument("path", nargs="?", default="src", help="Target source directory (default: 'src')")

    args = parser.parse_args()

    if args.command == "contrast":
        sys.exit(run_contrast_check(args.fg, args.bg))
    elif args.command == "target":
        sys.exit(run_target_check(args.width, args.height))
    elif args.command == "scan":
        sys.exit(run_codebase_scan(args.path))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
