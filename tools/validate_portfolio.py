"""Dependency-free validation for the public portfolio documentation."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
MERMAID_OPEN = re.compile(r"^```mermaid\s*$", re.MULTILINE)
MERMAID_BLOCK = re.compile(r"^```mermaid\s*\n(.*?)^```\s*$", re.MULTILINE | re.DOTALL)
MERMAID_DECLARATION = re.compile(
    r"^(?:flowchart\s+(?:TB|TD|BT|RL|LR)|stateDiagram-v2|sequenceDiagram)$"
)

# Public case studies are written for recruiters, hiring managers, and technical
# reviewers. Validation therefore enforces the externally useful structure rather
# than the earlier internal chronology/provenance template.
REQUIRED_CASE_SECTIONS = (
    "## Problem",
    "## Result",
    "## My ownership",
    "## Confidentiality",
)
EXPECTED_CASES = {
    "YIELD.md",
    "GRATING_PROCESS_ANALYTICS.md",
    "LEAN_DIGITAL_OPERATIONS.md",
    "MANUFACTURING_APPLICATION_PLATFORM.md",
}

# Terms that would indicate an accidental shift back to a private/employer-facing
# document. These are intentionally generic patterns, not private identifiers.
FORBIDDEN_PATTERNS = {
    "credential assignment": re.compile(r"(?i)\b(?:password|secret|token)\s*[:=]\s*[^`\s]+"),
    "private network address": re.compile(r"\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b"),
}


def markdown_files() -> list[Path]:
    return sorted(ROOT.rglob("*.md"))


def check_required_files(errors: list[str]) -> None:
    required = {
        ROOT / "README.md",
        ROOT / "docs" / "PORTFOLIO_INVENTORY.md",
        ROOT / "docs" / "EVIDENCE_AND_OWNERSHIP.md",
        ROOT / "docs" / "SCREENSHOT_MAPPING.md",
        ROOT / "assets" / "yield-summary.png",
    }
    required.update(ROOT / "case-studies" / name for name in EXPECTED_CASES)
    for path in sorted(required):
        if not path.exists():
            errors.append(f"missing required file: {path.relative_to(ROOT)}")


def check_case_structure(errors: list[str]) -> None:
    for name in EXPECTED_CASES:
        path = ROOT / "case-studies" / name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for heading in REQUIRED_CASE_SECTIONS:
            if heading not in text:
                errors.append(f"{path.relative_to(ROOT)}: missing {heading}")

        if "**What I built:**" not in text:
            errors.append(f"{path.relative_to(ROOT)}: missing external-facing What I built summary")
        if "**What it demonstrates:**" not in text:
            errors.append(f"{path.relative_to(ROOT)}: missing external-facing What it demonstrates summary")


def check_links(errors: list[str]) -> None:
    for path in markdown_files():
        text = path.read_text(encoding="utf-8")
        for match in MARKDOWN_LINK.finditer(text):
            target = match.group(1).strip()
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target_path = target.split("#", 1)[0]
            if not target_path:
                continue
            resolved = (path.parent / target_path).resolve()
            try:
                resolved.relative_to(ROOT)
            except ValueError:
                errors.append(f"{path.relative_to(ROOT)}: link escapes repository: {target}")
                continue
            if not resolved.exists():
                errors.append(f"{path.relative_to(ROOT)}: broken relative link: {target}")


def check_mermaid_blocks(errors: list[str]) -> None:
    for path in markdown_files():
        text = path.read_text(encoding="utf-8")
        opening_count = len(MERMAID_OPEN.findall(text))
        blocks = MERMAID_BLOCK.findall(text)
        if opening_count != len(blocks):
            errors.append(f"{path.relative_to(ROOT)}: unclosed Mermaid code fence")
            continue
        for index, block in enumerate(blocks, start=1):
            lines = [line.strip() for line in block.splitlines() if line.strip()]
            if not lines or not MERMAID_DECLARATION.fullmatch(lines[0]):
                errors.append(
                    f"{path.relative_to(ROOT)}: Mermaid block {index} has an unsupported declaration"
                )


def check_public_safety(errors: list[str]) -> None:
    for path in markdown_files():
        text = path.read_text(encoding="utf-8")
        for label, pattern in FORBIDDEN_PATTERNS.items():
            if pattern.search(text):
                errors.append(f"{path.relative_to(ROOT)}: possible {label}")


def main() -> int:
    errors: list[str] = []
    check_required_files(errors)
    check_case_structure(errors)
    check_links(errors)
    check_mermaid_blocks(errors)
    check_public_safety(errors)

    if errors:
        print("Portfolio validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Portfolio validation passed ({len(markdown_files())} Markdown files checked).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
