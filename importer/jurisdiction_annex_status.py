"""Read-only progress report for the legal-annex-to-geometry intake queue."""
from __future__ import annotations
import argparse
import json
from cli import database_connect


def report(act_code: str) -> dict:
    if not act_code.strip() or len(act_code)>80:
        raise ValueError("Invalid legal act code")
    with database_connect() as conn:
        act=conn.execute(
          """SELECT id,region_code,expected_annex_count
             FROM court_jurisdiction_normative_acts WHERE act_code=%s""",
          (act_code,)
        ).fetchone()
        if not act:
            raise ValueError("Act not found")
        slots=conn.execute(
          """SELECT a.annex_no, COUNT(DISTINCT b.id) AS source_batches,
                    COUNT(p.id) AS staged_polygons,
                    COUNT(p.id) FILTER (WHERE p.permitted_for_routing) AS wrongly_allowed
             FROM court_jurisdiction_annex_backlog a
             LEFT JOIN court_boundary_import_batches b
                    ON b.source_act_id=a.act_id AND b.annex_no=a.annex_no
             LEFT JOIN court_boundary_research_polygons p ON p.import_batch_id=b.id
             WHERE a.act_id=%s
             GROUP BY a.annex_no ORDER BY a.annex_no""",(act[0],)
        ).fetchall()
    if len(slots)!=act[2]:
        raise ValueError("Annex registry incomplete; do not infer full coverage")
    return {
      "act_code":act_code,"region_code":act[1],"expected_annexes":act[2],
      "annexes_with_staged_geometry":sum(x[1]>0 and x[2]>0 for x in slots),
      "annexes_awaiting_geometry":sum(x[2]==0 for x in slots),
      "staged_polygon_records":sum(x[2] for x in slots),
      "approved_for_routing":sum(x[3] for x in slots),
      "coverage_verified":False,
      "missing_annex_numbers":[x[0] for x in slots if x[2]==0],
      "notice":"Staged geometry is research-only. Presence of a feature is not a legally verified court boundary."
    }


def main() -> None:
    parser=argparse.ArgumentParser(description="Report annex ingestion without altering publication")
    parser.add_argument("--act-code",required=True)
    args=parser.parse_args()
    try:
        print(json.dumps(report(args.act_code),ensure_ascii=False,indent=2))
    except ValueError as exc:
        parser.exit(2,"Cannot report annex coverage: "+str(exc)+"\n")

if __name__=="__main__":main()
