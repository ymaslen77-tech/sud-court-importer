"""Read-only operational coverage report; counts are measured, never guessed."""
from __future__ import annotations
import json
from cli import database_connect


def report():
    with database_connect() as conn:
        verified=conn.execute(
            """SELECT count(*)::integer,
                      count(*) FILTER(WHERE verified_at<now()-interval '180 days')::integer
               FROM courts WHERE status='verified'"""
        ).fetchone()
        assert verified
        staged=conn.execute(
            """SELECT substring(i.external_code FROM 1 FOR 2) AS region_code,
                      s.source_type,count(DISTINCT i.external_code)::integer AS distinct_codes,
                      count(*) FILTER(WHERE i.review_status='pending')::integer AS pending_rows,
                      count(*) FILTER(WHERE i.review_status='approved')::integer AS approved_rows
               FROM court_import_rows i
               JOIN court_import_batches b ON b.id=i.batch_id
               JOIN sources s ON s.id=b.source_id
               GROUP BY substring(i.external_code FROM 1 FOR 2),s.source_type
               ORDER BY region_code,s.source_type"""
        ).fetchall()
        discovery=conn.execute(
            """SELECT b.registry,count(*)::integer AS rows,
                      count(*) FILTER(WHERE r.review_status='pending')::integer AS pending_rows
               FROM court_discovery_rows r
               JOIN court_discovery_batches b ON b.id=r.batch_id
               GROUP BY b.registry ORDER BY b.registry"""
        ).fetchall()
        reviews=conn.execute(
            """SELECT count(*)::integer FROM court_registry_diff_items
               WHERE review_status='pending'"""
        ).fetchone()
        monitor=conn.execute(
            """SELECT count(*) FILTER(WHERE enabled)::integer,
                      count(*) FILTER(WHERE enabled AND next_check_at<now())::integer,
                      count(*) FILTER(WHERE enabled AND last_error IS NOT NULL)::integer
               FROM court_source_watch"""
        ).fetchone()
        watcher=conn.execute(
            """SELECT count(*)::integer FROM court_source_watch_events
               WHERE status='pending'"""
        ).fetchone()
        profile=conn.execute(
            """SELECT count(*)::integer FROM court_profile_candidates
               WHERE status='pending'"""
        ).fetchone()
        judges=conn.execute(
            """SELECT count(*)::integer FROM judicial_appointment_candidates
               WHERE status='pending'"""
        ).fetchone()
        last=conn.execute(
            "SELECT max(checked_at) FROM court_source_watch WHERE last_error IS NULL"
        ).fetchone()
    return {
        "public_courts_verified":verified[0],
        "public_courts_older_than_180d":verified[1],
        "staged_by_region_and_source":[{
            "region_code":r[0],"source_type":r[1],
            "unique_codes_in_source":r[2],
            "pending_snapshot_rows_including_duplicates":r[3],
            "approved_snapshot_rows_including_duplicates":r[4]
        } for r in staged],
        "discovery_by_registry":[{
            "registry":r[0],"snapshot_rows_including_history":r[1],
            "pending_review_rows":r[2]
        } for r in discovery],
        "review_queues":{
            "registry_differences":reviews[0],
            "watched_page_changes":watcher[0],
            "court_field_proposals":profile[0],
            "judge_appointment_proposals":judges[0],
        },
        "monitor":{
            "registered_enabled":monitor[0],
            "due_or_overdue":monitor[1],
            "with_errors":monitor[2],
            "last_successful_check":last[0].isoformat() if last[0] else None,
        },
        "warnings":[
            "Source snapshots are historical and may overlap. Staged codes are not verified courts.",
            "This report does not prove national completeness or source-reuse permissions.",
            "A running local computer does not imply remote continuous monitoring."
        ]
    }


if __name__=="__main__":
    print(json.dumps(report(),ensure_ascii=False,indent=2))
