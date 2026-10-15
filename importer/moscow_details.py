"""Canonical PRIVATE evidence from extended Moscow contacts JSON fields.

The fields are described in historical Moscow open-data catalogs, but the
actual current publisher schema/license must be checked before operational use.
They are evidence for an editor, not official verification or appointment data.
"""
from __future__ import annotations
import json
import math
from contacts import ImportValidationError

# Source field -> private review queue field; none are automatically published.
FIELDS = (
    ("courtChairperson", "chairperson_as_listed"),
    ("courtFax", "fax"),
    ("courtWorkHours", "office_hours_observed"),
    ("courtWorkHoursChairperson", "chairperson_hours_observed"),
    ("courtWorkHoursReception", "reception_hours_observed"),
    ("courtWorkHoursArchive", "archive_hours_observed"),
    ("courtWorkHoursSubdivision", "subdivision_hours_observed"),
    ("courtPressSecretary", "press_secretary_as_listed"),
    ("courtMapUrl", "map_url_observed"),
    ("courtPath", "court_path_observed"),
)
REVIEW_FIELDS = tuple(target for _source,target in FIELDS)
MAX_FIELD_CHARS = 20_000
MAX_DEPTH = 8

def _canonical(value, depth=0):
    if depth > MAX_DEPTH:
        raise ImportValidationError("Contact detail nesting is too deep")
    if value is None:
        return None
    if isinstance(value,str):
        result=" ".join(value.split())
        if any(ord(char)<32 for char in result):
            raise ImportValidationError("Invalid control character in contact detail")
        return result or None
    if isinstance(value,bool):
        return value
    if isinstance(value,(int,float)):
        if not math.isfinite(value):
            raise ImportValidationError("Non-finite court contact detail")
        return value
    if isinstance(value,list):
        if len(value)>200:
            raise ImportValidationError("Too many detail entries")
        return [_canonical(item,depth+1) for item in value]
    if isinstance(value,dict):
        if len(value)>200 or any(not isinstance(key,str) or len(key)>200 for key in value):
            raise ImportValidationError("Invalid court detail object")
        return {key:_canonical(item,depth+1) for key,item in value.items()}
    raise ImportValidationError("Unrecognized court contact detail type")

def extract(row:dict)->dict[str,str|None]:
    """Return normalized detailed evidence only for unclassified Moscow exports."""
    if not isinstance(row,dict):
        raise ImportValidationError("Raw contact evidence must be an object")
    if row.get("_registry"):
        return {}  # Other registry schemas have independent parsers.
    found={}
    for source,target in FIELDS:
        if source not in row:
            continue
        value=_canonical(row[source])
        if value is None:
            found[target]=None
        elif isinstance(value,str):
            found[target]=value
        else:
            found[target]=json.dumps(value,ensure_ascii=False,sort_keys=True,
                                     separators=(",",":"),allow_nan=False)
        if found[target] is not None and len(found[target])>MAX_FIELD_CHARS:
            raise ImportValidationError("Court contact detail is oversized: "+source)
    return found
