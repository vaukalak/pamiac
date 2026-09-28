#!/usr/bin/env python3
"""Dump a public Notion lesson page to stdout for Kemna geography authoring."""

from __future__ import annotations

import json
import sys
import urllib.request

SPLITBEE = "https://notion-api.splitbee.io/v1/page/"


def unwrap(wrap: dict) -> dict:
    val = wrap.get("value")
    if isinstance(val, dict) and isinstance(val.get("value"), dict) and "type" in val["value"]:
        return val["value"]
    return val if isinstance(val, dict) else {}


def flatten(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "".join(flatten(item) for item in value)
    return ""


def title_of(val: dict) -> str:
    return flatten((val.get("properties") or {}).get("title") or [])


def fetch_page(page_id: str) -> dict:
    url = SPLITBEE + page_id.replace("-", "")
    req = urllib.request.Request(url, headers={"User-Agent": "KemnaLessonAuthor/1.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read())


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: fetch-notion.py <notion-page-id>", file=sys.stderr)
        return 2
    page_id = sys.argv[1]
    data = fetch_page(page_id)
    root = None
    for wrap in data.values():
        val = unwrap(wrap)
        if val.get("id") == page_id or val.get("id") == page_id.replace("-", ""):
            root = val
            break
    if root is None:
        for wrap in data.values():
            val = unwrap(wrap)
            if val.get("type") == "page" and title_of(val):
                root = val
                break
    if root is None:
        print("page not found", file=sys.stderr)
        return 1

    print(f"# {title_of(root)}")
    print()
    for child_id in root.get("content") or []:
        wrap = data.get(child_id)
        if not wrap:
            continue
        val = unwrap(wrap)
        kind = val.get("type")
        text = title_of(val)
        if kind in {"header", "sub_header", "sub_sub_header"}:
            hashes = {"header": "##", "sub_header": "###", "sub_sub_header": "####"}[kind]
            print(f"{hashes} {text}")
            print()
        elif kind in {"text", "bulleted_list", "numbered_list", "callout", "quote"}:
            if text.strip():
                prefix = "- " if kind == "bulleted_list" else ""
                print(f"{prefix}{text}")
                print()
        elif kind == "page":
            print(f"- child page: {text} ({child_id})")
            print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
