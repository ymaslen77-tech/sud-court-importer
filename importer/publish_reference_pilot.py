"""Publish only the ten explicitly selected, source-labelled public reference profiles.

This does NOT approve court_import_rows, verify existing research observations,
create courts/judges/court_facts or attest current source freshness.

  python importer/publish_reference_pilot.py --validate
  python importer/publish_reference_pilot.py --publish --confirm
"""
import argparse
import json
from pathlib import Path

from contacts import ImportValidationError
from cli import database_connect
from stage_pilot_evidence import observations

ROOT=Path(__file__).resolve().parents[1]
MATRIX=ROOT/"apps/web/app/lib/pilot-review-matrix.json"


def release_candidates() -> list[dict]:
    matrix=json.loads(MATRIX.read_text(encoding="utf-8"))
    evidence=observations()
    if len(evidence)!=48 or matrix.get("automatic_publication_permitted") is not False:
        raise ImportValidationError("Pilot source evidence does not match current reviewed research")
    rows=matrix["records"]
    if len(rows)!=10 or len({x["external_code"] for x in rows})!=10:
        raise ImportValidationError("Ten unique manually selected court references required")
    result=[]
    for item in rows:
        if item["publication_state"]!="pending" or item["editorial_approved"] is not False:
            raise ImportValidationError("Must never repurpose source snapshots as verified")
        if not item["archived_values"]["address"] or not item["archived_values"]["email"]:
            raise ImportValidationError("No published core without address and e-mail")
        if item["official_identifier_crosscheck"]!="pending":
            raise ImportValidationError("Code status changed: re-review publication")
        if not item["https_site_url"].startswith("https://") or not item["https_site_url"].endswith(".sudrf.ru/"):
            raise ImportValidationError("Unsafe public court reference URL")
        result.append({
            "code":item["external_code"],"batch":item["batch_id"],"sha":item["record_sha256"],
            "region":item["region_code"],"slug":"sud-"+item["external_code"].lower(),
            "name":item["official_header_court_name"],"home":item["https_site_url"],
            "source":item["individual_source_url"],"observed":matrix["observed_on"]
        })
    return result


def publish(rows:list[dict])->dict:
    count=0
    with database_connect() as conn:
        with conn.transaction():
            for item in rows:
                row=conn.execute(
                    """SELECT id FROM court_import_rows
                       WHERE batch_id=%s AND external_code=%s AND record_sha256=%s
                         AND review_status='pending' FOR SHARE""",
                    (item["batch"],item["code"],item["sha"])
                ).fetchone()
                if row is None:
                    raise ImportValidationError("Pilot origin moved; all writes rolled back")
                match=conn.execute(
                    """SELECT COUNT(*) FROM court_import_evidence
                       WHERE import_row_id=%s AND review_status='research_only'
                       AND field_name IN('court_name','address','phone','email')""",
                    (row[0],)
                ).fetchone()[0]
                if match<4:
                    raise ImportValidationError("Insufficient field-level original evidence")
                header=conn.execute(
                    """SELECT count(*) FROM court_import_evidence
                       WHERE import_row_id=%s AND field_name='court_name'
                       AND observed_value=%s AND review_status='research_only'""",
                    (row[0],item["name"])
                ).fetchone()[0]
                if header<1:
                    raise ImportValidationError("Official heading missing from referenced research")
                inserted=conn.execute(
                    """INSERT INTO court_public_references
                       (import_row_id,region_code,external_code,public_slug,
                        official_header_name,official_home_url,source_url,source_observed_on)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                       ON CONFLICT DO NOTHING RETURNING import_row_id""",
                    (row[0],item["region"],item["code"],item["slug"],item["name"],
                     item["home"],item["source"],item["observed"])
                ).fetchone()
                count+=int(inserted is not None)
    return {"new_public_references":count,"unchanged":len(rows)-count,
            "verified_courts_created":0,"source_current_attestations_created":0}


def main():
    parser=argparse.ArgumentParser(description="Create sourced reference records separate from verified courts")
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--validate",action="store_true")
    group.add_argument("--publish",action="store_true")
    parser.add_argument("--confirm",action="store_true")
    args=parser.parse_args()
    if args.publish and not args.confirm:
        parser.error("--publish --confirm required for reference publication")
    try:
        rows=release_candidates()
        result={"profiles":len(rows),"verified_courts_created":0}
        if args.publish:result.update(publish(rows))
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except (ValueError,OSError,ImportValidationError) as exc:
        parser.exit(2,"Reference publication validation failed: "+str(exc)+"\n")


if __name__=="__main__":
    main()
