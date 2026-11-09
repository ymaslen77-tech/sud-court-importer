#!/usr/bin/env python3
"""Reject all VPS requests except a uniquely identified private Moscow preflight.

This file intentionally has no arbitrary command, shell, path, deploy,
credential, --apply, or --push input surface.
"""
import argparse
import json
from pathlib import Path
import re

ID = re.compile(r"^[a-z][a-z0-9_-]{3,79}$")
ALLOWED = {"schemaVersion","operation","requestId"}

def validate(path):
    if not path.is_file() or path.stat().st_size > 2048:
        raise ValueError("Expected bounded local JSON request")
    data=json.loads(path.read_text(encoding="utf-8"))
    if (not isinstance(data,dict) or set(data) != ALLOWED
        or type(data["schemaVersion"]) is not int or data["schemaVersion"] != 1
        or data["operation"] != "moscow-private-preflight"
        or not isinstance(data["requestId"],str)
        or not ID.fullmatch(data["requestId"])):
        raise ValueError("Unsupported or potentially unsafe VPS request")
    return {"operation":"moscow-private-preflight","requestId":data["requestId"],
            "serverChanges":"private_stage_only","deploy":False,"publish":False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request",type=Path)
    args=parser.parse_args()
    result=validate(args.request)
    print(json.dumps(result,ensure_ascii=False))

if __name__=="__main__":
    main()
