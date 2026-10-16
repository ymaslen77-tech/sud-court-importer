"""Convert a source-transcribed WGS84 coordinates CSV to bounded GeoJSON.

CSV fields: feature_id,polygon_id,ring_id,vertex_order,lon,lat,court_code.
Only EPSG:4326, no inferred CRS and no silent closing of rings.
Usage:
 python importer/jurisdiction_coordinates_csv.py coords.csv output.geojson --crs EPSG:4326
The resulting GeoJSON must then pass jurisdiction_geometry.py inspect.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import csv
import json
from pathlib import Path
import re

from jurisdiction_geometry import BoundaryValidationError, validate_geojson

HEADERS=["feature_id","polygon_id","ring_id","vertex_order","lon","lat","court_code"]
MAX_ROWS=50_000
MAX_BYTES=8_000_000


def convert_csv(source: Path) -> dict:
    if not source.is_file() or source.stat().st_size>MAX_BYTES:
        raise BoundaryValidationError("CSV unavailable or too large")
    data=defaultdict(lambda:defaultdict(lambda:defaultdict(list)))
    court_codes={}
    keys=set()
    with source.open("r",encoding="utf-8-sig",newline="") as fd:
        reader=csv.DictReader(fd)
        if reader.fieldnames!=HEADERS:
            raise BoundaryValidationError("CSV columns must match the exact documented order")
        for idx,row in enumerate(reader):
            if idx>=MAX_ROWS:
                raise BoundaryValidationError("Too many coordinate records")
            fid=row["feature_id"]
            poly=row["polygon_id"]
            ring=row["ring_id"]
            if not fid or not re.fullmatch(r"[A-Za-z0-9._:-]{1,100}",fid) or not poly.isdigit() or not ring.isdigit():
                raise BoundaryValidationError("Invalid polygon identifiers")
            try:
                order=int(row["vertex_order"])
                lon=float(row["lon"]);lat=float(row["lat"])
            except (ValueError,TypeError) as exc:
                raise BoundaryValidationError("Non-numeric coordinate or vertex index") from exc
            if order<0:
                raise BoundaryValidationError("Negative vertex index")
            key=(fid,int(poly),int(ring),order)
            if key in keys:
                raise BoundaryValidationError("Duplicate vertex order within ring")
            keys.add(key)
            code=row["court_code"] or None
            if fid in court_codes and court_codes[fid]!=code:
                raise BoundaryValidationError("Conflicting proposed court codes for same feature")
            court_codes[fid]=code
            data[fid][int(poly)][int(ring)].append((order,[lon,lat]))
    if not data:
        raise BoundaryValidationError("Empty coordinate CSV")
    features=[]
    for fid,polygons in sorted(data.items()):
        parts=[]
        for _,rings in sorted(polygons.items()):
            if 0 not in rings:
                raise BoundaryValidationError("Polygon missing exterior ring_id=0")
            paths=[]
            for ring_id,vertices in sorted(rings.items()):
                if sorted(x[0] for x in vertices)!=list(range(len(vertices))):
                    raise BoundaryValidationError("Vertex order must be contiguous from 0")
                paths.append([pt for _,pt in sorted(vertices)])
            parts.append(paths)
        geometry={"type":"MultiPolygon","coordinates":parts}
        features.append({"type":"Feature",
                         "properties":{"feature_id":fid,"court_code":court_codes[fid]},
                         "geometry":geometry})
    result={"type":"FeatureCollection","features":features}
    validate_geojson(result)
    return result


def main():
    parser=argparse.ArgumentParser(description="Turn verified-format coordinate CSV into GIS data for manual review")
    parser.add_argument("input",type=Path)
    parser.add_argument("output",type=Path)
    parser.add_argument("--crs",required=True)
    args=parser.parse_args()
    if args.crs!="EPSG:4326":
        parser.error("Only EPSG:4326 supported; never guess or auto-convert undocumented coordinate systems")
    try:
        geojson=convert_csv(args.input)
        if args.output.exists():
            raise BoundaryValidationError("Output file already exists; refusing overwrite")
        args.output.write_text(json.dumps(geojson,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
        print(json.dumps({"features":len(geojson["features"]),
                          "output":str(args.output),"published":0},ensure_ascii=False))
    except (BoundaryValidationError,OSError) as exc:
        parser.exit(2,"Coordinate conversion rejected: "+str(exc)+"\n")


if __name__=="__main__":main()
