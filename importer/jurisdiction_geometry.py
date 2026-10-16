"""Universal offline-first staging for official court territory polygons.

Supported input: manifest JSON + GeoJSON FeatureCollection (EPSG:4326).
This module does not scrape, geocode, approve or change public court matching.

Examples:
 python importer/jurisdiction_geometry.py inspect manifest.json boundaries.geojson
 python importer/jurisdiction_geometry.py stage manifest.json boundaries.geojson --confirm
 python importer/jurisdiction_geometry.py audit --region 54
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import date
from hashlib import sha256
import json
import math
from pathlib import Path
import re
from urllib.parse import urlsplit

from shapely.geometry import MultiPolygon, Polygon, shape, mapping
from shapely.validation import explain_validity

MAX_SOURCE_BYTES = 16_000_000
MAX_FEATURES = 1000
MAX_POINTS = 50_000
CODE = re.compile(r"^[0-9A-Z][0-9A-Z-]{2,29}$")
HASH = re.compile(r"^[0-9a-f]{64}$")
FEATURE = re.compile(r"^[0-9A-Za-z][0-9A-Za-z._:-]{0,99}$")


class BoundaryValidationError(ValueError):
    pass


def _read_json(path: Path, limit: int):
    if not path.is_file() or path.stat().st_size > limit:
        raise BoundaryValidationError("Missing file or file exceeds configured limit")
    data = path.read_bytes()
    try:
        parsed = json.loads(data, parse_constant=lambda n: (_ for _ in ()).throw(
            BoundaryValidationError("NaN/Infinity not permitted: " + n)))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise BoundaryValidationError("Invalid UTF-8 JSON") from exc
    return parsed, data


def official_source(value: str) -> bool:
    if not isinstance(value, str) or len(value) > 1800:
        return False
    try:
        u = urlsplit(value)
        host = (u.hostname or "").lower()
        host_allowed = host in ("publication.pravo.gov.ru", "pravo.gov.ru", "sudrf.ru") or host.endswith(".sudrf.ru")
        return (u.scheme == "https" and not u.username and not u.password and
                u.port in (None, 443) and bool(host) and host_allowed)
    except ValueError:
        return False


def _iso_date(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except (TypeError, ValueError) as exc:
        raise BoundaryValidationError("source_observed_on must be ISO YYYY-MM-DD") from exc
    if parsed > date.today():
        raise BoundaryValidationError("Research date cannot be in the future")
    return parsed.isoformat()


def validate_manifest(value: dict) -> dict:
    if not isinstance(value, dict) or value.get("schema_version") != 1:
        raise BoundaryValidationError("Unsupported manifest version")
    if set(value) != {
        "schema_version", "region_code", "source_url", "source_document_sha256",
        "source_observed_on", "source_kind", "act_code", "annex_no",
        "crs", "conversion_method"
    }:
        raise BoundaryValidationError("Manifest fields differ from version 1 schema")
    region = value["region_code"]
    if not isinstance(region, str) or not re.fullmatch(r"[0-9]{2}", region):
        raise BoundaryValidationError("Invalid region code")
    if not official_source(value["source_url"]):
        raise BoundaryValidationError("Unsupported source domain: require HTTPS official court/legal source")
    if not isinstance(value["source_document_sha256"], str) or not HASH.fullmatch(value["source_document_sha256"]):
        raise BoundaryValidationError("Invalid SHA-256 for referenced official source document")
    if value["crs"] != "EPSG:4326":
        raise BoundaryValidationError("Input must explicitly use WGS84 lon/lat EPSG:4326; reproject before staging")
    if not isinstance(value["conversion_method"], str) or len(value["conversion_method"].strip()) < 16:
        raise BoundaryValidationError("Provide a real conversion provenance description")
    if value["source_kind"] not in ("official_legal_annex", "official_court_publication"):
        raise BoundaryValidationError("Unknown source kind")
    if value["source_kind"] == "official_legal_annex":
        if not isinstance(value["act_code"], str) or not (5 <= len(value["act_code"]) <= 80):
            raise BoundaryValidationError("Legal annex requires official act_code")
        if type(value["annex_no"]) is not int or not (1 <= value["annex_no"] <= 10000):
            raise BoundaryValidationError("Invalid annex number")
    elif value["act_code"] is not None or value["annex_no"] is not None:
        raise BoundaryValidationError("Court publication must not assign an act annex")
    value = dict(value)
    value["source_observed_on"] = _iso_date(value["source_observed_on"])
    return value


@dataclass(frozen=True)
class CandidatePolygon:
    feature_id: str
    court_code: str | None
    geojson: str
    points: int


def _coordinate_points(obj: object):
    """Reject malformed coordinates BEFORE geometry coercion or repair."""
    count = 0
    stack = [obj]
    while stack:
        value = stack.pop()
        if not isinstance(value, list) or not value:
            raise BoundaryValidationError("Coordinates must be nonempty arrays")
        if len(value) >= 2 and all(type(v) in (int, float) for v in value):
            if len(value) != 2:
                raise BoundaryValidationError("Only two-dimensional WGS84 coordinates are supported")
            lon, lat = value
            if not all(math.isfinite(v) for v in (lon, lat)) or not (-180 <= lon <= 180 and -90 <= lat <= 90):
                raise BoundaryValidationError("Longitude/latitude outside EPSG:4326 bounds")
            count += 1
            if count > MAX_POINTS:
                raise BoundaryValidationError("Polygon exceeds vertex cap")
        else:
            stack.extend(value)
    return count


def validate_geojson(value: object) -> list[CandidatePolygon]:
    if not isinstance(value, dict) or value.get("type") != "FeatureCollection":
        raise BoundaryValidationError("Expected GeoJSON FeatureCollection")
    if value.get("crs") not in (None, {"type": "name", "properties": {"name": "EPSG:4326"}}):
        raise BoundaryValidationError("Unrecognized GeoJSON CRS")
    features = value.get("features")
    if not isinstance(features, list) or not (1 <= len(features) <= MAX_FEATURES):
        raise BoundaryValidationError("Must contain between 1 and 1000 polygon features")
    result: list[CandidatePolygon] = []
    seen: set[str] = set()
    for feature in features:
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            raise BoundaryValidationError("Expected individual GeoJSON Feature")
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            raise BoundaryValidationError("Missing feature properties")
        fid = properties.get("feature_id")
        if not isinstance(fid, str) or not FEATURE.fullmatch(fid) or fid in seen:
            raise BoundaryValidationError("Invalid or duplicate feature_id")
        seen.add(fid)
        code = properties.get("court_code")
        if code is not None and (not isinstance(code, str) or not CODE.fullmatch(code)):
            raise BoundaryValidationError("Invalid proposed court code")
        geom_data = feature.get("geometry")
        if not isinstance(geom_data, dict) or geom_data.get("type") not in ("Polygon", "MultiPolygon"):
            raise BoundaryValidationError("Only Polygon and MultiPolygon are accepted")
        pts = _coordinate_points(geom_data.get("coordinates"))
        try:
            geom = shape(geom_data)
        except (TypeError, ValueError, IndexError, AttributeError) as exc:
            raise BoundaryValidationError("Invalid Polygon coordinate nesting") from exc
        if geom.is_empty or not geom.is_valid or geom.area <= 0:
            raise BoundaryValidationError(f"Invalid boundary {fid}: {explain_validity(geom)}")
        poly = MultiPolygon([geom]) if isinstance(geom, Polygon) else geom
        if not isinstance(poly, MultiPolygon):
            raise BoundaryValidationError("Unexpected geometry type")
        # GeoJSON serialization removes unsupported properties and limits DB payload.
        rendered = json.dumps(mapping(poly), ensure_ascii=False, allow_nan=False, separators=(",", ":"))
        result.append(CandidatePolygon(fid, code, rendered, pts))
    return result


def inspect(manifest_path: Path, geometry_path: Path) -> tuple[dict, list[CandidatePolygon], str]:
    manifest, _ = _read_json(manifest_path, 30_000)
    geo, raw = _read_json(geometry_path, MAX_SOURCE_BYTES)
    manifest = validate_manifest(manifest)
    candidates = validate_geojson(geo)
    file_sha = sha256(raw).hexdigest()
    return manifest, candidates, file_sha


def _database():
    from cli import database_connect
    return database_connect()


def stage(manifest: dict, features: list[CandidatePolygon], file_sha: str) -> dict:
    # Source digest is declared by preparer, not independently attested by this program.
    with _database() as conn:
        with conn.transaction():
            conn.execute("SELECT pg_advisory_xact_lock(1602202606)")
            act_id = None
            if manifest["source_kind"] == "official_legal_annex":
                act = conn.execute(
                    """SELECT id, region_code FROM court_jurisdiction_normative_acts
                       WHERE act_code=%s""", (manifest["act_code"],)
                ).fetchone()
                if act is None or act[1] != manifest["region_code"]:
                    raise BoundaryValidationError("Act not found or does not match region")
                act_id = act[0]
                slot = conn.execute(
                    """SELECT 1 FROM court_jurisdiction_annex_backlog
                       WHERE act_id=%s AND annex_no=%s""",
                    (act_id, manifest["annex_no"]),
                ).fetchone()
                if slot is None:
                    raise BoundaryValidationError("Unknown legal annex: no staged legal act slot")
            selected = conn.execute(
                """SELECT id FROM court_boundary_import_batches
                   WHERE region_code=%s AND source_url=%s AND geometry_file_sha256=%s""",
                (manifest["region_code"], manifest["source_url"], file_sha)
            ).fetchone()
            if selected:
                return {"batch_id": selected[0], "created": False,
                        "polygons": len(features), "published": 0}
            batch = conn.execute(
                """INSERT INTO court_boundary_import_batches
                    (region_code,source_url,source_document_sha256,geometry_file_sha256,
                     source_act_id,annex_no,source_kind,source_observed_on,conversion_method)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (manifest["region_code"], manifest["source_url"], manifest["source_document_sha256"],
                 file_sha, act_id, manifest["annex_no"], manifest["source_kind"],
                 manifest["source_observed_on"], manifest["conversion_method"])
            ).fetchone()
            assert batch is not None
            for feature in features:
                conn.execute(
                    """INSERT INTO court_boundary_research_polygons
                     (import_batch_id,feature_id,proposed_court_code,geom)
                     VALUES (%s,%s,%s,ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(%s),4326)))""",
                    (batch[0],feature.feature_id,feature.court_code,feature.geojson)
                )
            return {"batch_id": batch[0], "created": True, "polygons": len(features),
                    "published": 0, "source_digest_attested": False}


def audit(region_code: str) -> dict:
    # Nonzero areal intersections are reported, not silently fixed or approved.
    if not re.fullmatch(r"[0-9]{2}", region_code):
        raise BoundaryValidationError("Invalid region code")
    with _database() as conn:
        total = conn.execute(
            """SELECT COUNT(*) FROM court_boundary_research_polygons p
               JOIN court_boundary_import_batches b ON b.id=p.import_batch_id
               WHERE b.region_code=%s""",(region_code,)
        ).fetchone()[0]
        pairs = conn.execute(
            """SELECT p.id,q.id,round((ST_Area(ST_Intersection(p.geom,q.geom)::geography))::numeric,1)
               FROM court_boundary_research_polygons p
               JOIN court_boundary_import_batches bp ON bp.id=p.import_batch_id
               JOIN court_boundary_research_polygons q ON p.id<q.id AND p.geom&&q.geom
               JOIN court_boundary_import_batches bq ON bq.id=q.import_batch_id
               WHERE bp.region_code=%s AND bq.region_code=%s
                 AND ST_Intersects(p.geom,q.geom)
                 AND ST_Area(ST_Intersection(p.geom,q.geom)::geography)>1
               ORDER BY p.id,q.id LIMIT 200""",(region_code,region_code)
        ).fetchall()
        return {"region":region_code,"staged_polygons":total,
                "overlap_pairs_first_200":[{"left_id":a,"right_id":b,"area_sq_m":float(c)} for a,b,c in pairs],
                "truncated":len(pairs)>=200,"approved":0}


def main() -> None:
    parser = argparse.ArgumentParser(description="Stage official polygons: NEVER publish without separate legal review")
    subs = parser.add_subparsers(dest="command",required=True)
    for mode in ("inspect", "stage"):
        cmd = subs.add_parser(mode)
        cmd.add_argument("manifest",type=Path)
        cmd.add_argument("geojson",type=Path)
        if mode == "stage":cmd.add_argument("--confirm",action="store_true")
    audit_parser = subs.add_parser("audit")
    audit_parser.add_argument("--region",required=True)
    args=parser.parse_args()
    if args.command=="stage" and not args.confirm:
        parser.error("Database writes require --stage --confirm")
    try:
        if args.command=="audit":
            output=audit(args.region)
        else:
            manifest,features,file_sha=inspect(args.manifest,args.geojson)
            output={
                "source_url":manifest["source_url"],"region":manifest["region_code"],
                "file_sha256":file_sha,"features":len(features),
                "vertices":sum(x.points for x in features),
                "court_codes_claimed":sorted({x.court_code for x in features if x.court_code}),
                "research_only":True,"published":0,
                "source_document_sha256_claimed_not_attested":manifest["source_document_sha256"]
            }
            if args.command=="stage":output.update(stage(manifest,features,file_sha))
        print(json.dumps(output,ensure_ascii=False,indent=2))
    except (BoundaryValidationError, OSError, ValueError) as exc:
        parser.exit(2,"Boundary staging rejected: "+str(exc)+"\n")


if __name__=="__main__":
    main()
