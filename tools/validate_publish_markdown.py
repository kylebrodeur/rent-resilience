#!/usr/bin/env python3
"""Publish gate for reader-facing copy: markdown pieces and the site's HTML pages.

Vendored from Kyle's publishing system
( Personal-Publishing-Plan/00-system/00.02-operations/publishing/tools/validate_publish_markdown.py )
and extended here with an HTML mode so the landing and status pages run through
the same checks. Markdown behavior is unchanged from the canonical tool.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from typing import NamedTuple


class Finding(NamedTuple):
    code: str
    line: int
    message: str


FRONTMATTER_VALUE = re.compile(r"^([A-Za-z0-9_-]+):\s*(.*)$")
MARKDOWN_IMAGE = re.compile(r"^\s*!\[([^]]*)\]\(([^)]+)\)\s*$")
HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
REDUNDANT_CURRENCY = re.compile(r"\$\d+(?:\.\d+)?\s+dollars?\b", re.IGNORECASE)
HTML_SCRIPT_STYLE = re.compile(r"<(script|style)\b.*?</\1\s*>", re.DOTALL | re.IGNORECASE)
HTML_TAG = re.compile(r"<[^>]*>")


def _unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def _split_document(markdown: str) -> tuple[dict[str, str], list[tuple[int, str]]]:
    lines = markdown.splitlines()
    frontmatter: dict[str, str] = {}
    body_start = 0

    if lines and lines[0].strip() == "---":
        for index in range(1, len(lines)):
            if lines[index].strip() == "---":
                body_start = index + 1
                break
            match = FRONTMATTER_VALUE.match(lines[index])
            if match:
                frontmatter[match.group(1)] = _unquote(match.group(2))

    body = [(index + 1, line) for index, line in enumerate(lines[body_start:], body_start)]
    return frontmatter, body


def _next_nonblank(body: list[tuple[int, str]], index: int) -> tuple[int, str] | None:
    for candidate in body[index + 1 :]:
        if candidate[1].strip():
            return candidate
    return None


def validate_text(markdown: str) -> list[Finding]:
    frontmatter, body = _split_document(markdown)
    findings: list[Finding] = []
    h1: tuple[int, str] | None = None
    in_code_fence = False

    for index, (line_number, line) in enumerate(body):
        stripped = line.strip()

        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_code_fence = not in_code_fence
            continue

        if in_code_fence:
            continue

        if "—" in line or "–" in line:
            findings.append(Finding("dash", line_number, "Replace em/en dashes in publish-bound text."))

        if "[[KB:" in line:
            findings.append(Finding("editor-note", line_number, "Resolve the [[KB: ...]] editorial note."))

        if "<mark>" in line or "</mark>" in line:
            findings.append(Finding("review-mark", line_number, "Accept or reject the marked revision before staging."))

        if "![[" in line:
            findings.append(
                Finding("obsidian-image", line_number, "Replace the Obsidian embed with portable Markdown image syntax.")
            )

        if REDUNDANT_CURRENCY.search(line):
            findings.append(
                Finding("redundant-currency-unit", line_number, "Use either the currency symbol or the word dollars, not both.")
            )

        heading = HEADING.match(line)
        if heading:
            if heading.group(1) == "#" and h1 is None:
                h1 = (line_number, heading.group(2))
            if index > 0 and body[index - 1][1].strip():
                findings.append(Finding("heading-spacing", line_number, "Add a blank line before this heading."))

        image = MARKDOWN_IMAGE.match(line)
        if image:
            if not image.group(1).strip():
                findings.append(Finding("image-alt", line_number, "Add descriptive alt text to the image."))
            following = _next_nonblank(body, index)
            if not following or not re.match(r"^\*[^*].*\*\s*$", following[1].strip()):
                findings.append(
                    Finding("image-caption", line_number, "Follow the image with an italic caption that explains why it matters.")
                )

    title = frontmatter.get("title", "").strip()
    if title and h1 and title != h1[1]:
        findings.append(
            Finding("title-mismatch", h1[0], f'Frontmatter title "{title}" does not match H1 "{h1[1]}".')
        )

    return sorted(findings, key=lambda item: (item.line, item.code))


def _html_text_lines(html: str) -> list[tuple[int, str]]:
    """Strip script/style blocks and tags, keeping original line numbers."""
    stripped = HTML_SCRIPT_STYLE.sub("", html)
    lines: list[tuple[int, str]] = []
    for line_number, line in enumerate(stripped.splitlines(), 1):
        text = HTML_TAG.sub(" ", line)
        if text.strip():
            lines.append((line_number, text))
    return lines


def validate_html(html: str) -> list[Finding]:
    """The markdown gate's line-level checks, applied to page text."""
    findings: list[Finding] = []
    for line_number, line in _html_text_lines(html):
        if "—" in line or "–" in line:
            findings.append(Finding("dash", line_number, "Replace em/en dashes in publish-bound text."))
        if "[[KB:" in line:
            findings.append(Finding("editor-note", line_number, "Resolve the [[KB: ...]] editorial note."))
        if "<mark>" in line or "</mark>" in line:
            findings.append(Finding("review-mark", line_number, "Accept or reject the marked revision before staging."))
        if REDUNDANT_CURRENCY.search(line):
            findings.append(
                Finding("redundant-currency-unit", line_number, "Use either the currency symbol or the word dollars, not both.")
            )
    return sorted(findings, key=lambda item: (item.line, item.code))


def validate_path(path: pathlib.Path) -> list[Finding]:
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() in {".html", ".htm"}:
        return validate_html(text)
    return validate_text(text)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=pathlib.Path)
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args(argv)

    report: list[dict[str, object]] = []
    for path in args.paths:
        findings = validate_path(path)
        for finding in findings:
            report.append(
                {
                    "path": str(path),
                    "line": finding.line,
                    "code": finding.code,
                    "message": finding.message,
                }
            )

    if args.as_json:
        print(json.dumps(report, indent=2))
    else:
        for item in report:
            print(f"{item['path']}:{item['line']} [{item['code']}] {item['message']}")

    if report:
        print(f"publish gate: {len(report)} finding(s)", file=sys.stderr)
        return 1

    print("publish gate: clean")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())