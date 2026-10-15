"""Stage saved, separately-authorized official contact HTML into a PRIVATE queue.

The associated court watch must already be registered by an operator.  A
changed contact is *only* an observation, never evidence for disabling a
public phone or changing an appointment.
"""
from __future__ import annotations
import argparse
from datetime import date, timedelta
from pathlib import Path
import json
from hashlib import sha256

from cli import database_connect
from contacts import ImportValidationError
from official_contact_html import MAX_HTML_BYTES, compare, extract, official_hours_url

def validated_capture(value: str) -> date:
    try:
        captured=date.fromisoformat(value)
    except (TypeError,ValueError) as exc:
        raise ImportValidationError("Capture date must be YYYY-MM-DD") from exc
    if not timedelta(0)<=date.today()-captured<=timedelta(days=30):
        raise ImportValidationError("Capture must be within last 30 days")
    return captured


def stage(watch_id:int,source_url:str,raw:bytes,captured_on:date,reviewer:str,
          attested:bool)->dict:
    if (not isinstance(watch_id,int) or watch_id<1 or not attested
        or not isinstance(reviewer,str) or not 2<=len(reviewer.strip())<=120):
        raise ImportValidationError("Existing watch, named reviewer and explicit source attestation required")
    official_hours_url(source_url)
    observed=extract(raw)
    digest=sha256(raw).hexdigest()
    from psycopg.types.json import Jsonb
    with database_connect() as conn:
        with conn.transaction():
            watch=conn.execute(
                """SELECT w.watch_url,w.scope,c.status
                   FROM court_source_watch w JOIN courts c ON c.id=w.court_id
                   WHERE w.id=%s AND w.enabled=true FOR UPDATE OF w""",(watch_id,)
            ).fetchone()
            if not watch or watch[0]!=source_url or watch[1] not in ('contacts','hours') or watch[2]!='verified':
                raise ImportValidationError("Snapshot requires matching enabled authorized verified-court watch")
            prev=conn.execute(
                """SELECT id,captured_on,observations FROM court_contact_snapshots
                   WHERE watch_id=%s ORDER BY captured_on DESC,id DESC LIMIT 1""",
                (watch_id,)
            ).fetchone()
            existing=conn.execute(
                """SELECT id FROM court_contact_snapshots
                   WHERE watch_id=%s AND content_sha256=%s""",(watch_id,digest)
            ).fetchone()
            if existing:
                return {"snapshot_id":existing[0],"created":False,"signals":0,"published":0}
            if prev and captured_on<prev[1]:
                raise ImportValidationError("An older captured snapshot cannot generate new current-contact signals")
            inserted=conn.execute(
                """INSERT INTO court_contact_snapshots
                   (watch_id,captured_on,content_sha256,source_url,observed_by,observations)
                   VALUES(%s,%s,%s,%s,%s,%s) RETURNING id""",
                (watch_id,captured_on,digest,source_url,reviewer.strip(),Jsonb(observed))
            ).fetchone()
            assert inserted
            count=0
            if prev:
                earlier=prev[2]
                # Older snapshots were independently validated on ingestion,
                # and must be compared using the exact same watch/source.
                differences=compare(earlier,observed)["signals"]
                for item in differences:
                    conn.execute(
                        """INSERT INTO court_contact_change_events
                           (older_snapshot_id,newer_snapshot_id,contact_kind,
                            contact_key,change_kind,source_context)
                           VALUES(%s,%s,%s,%s,%s,%s)
                           ON CONFLICT DO NOTHING""",
                        (prev[0],inserted[0],item["kind"],item["value"],item["event"],
                         item["new_context"] or item["old_context"])
                    )
                count=len(differences)
    return {"snapshot_id":inserted[0],"created":True,"signals":count,"published":0}


def pending(limit:int=50)->dict:
    if not 1<=limit<=200:
        raise ImportValidationError("Limit must be 1-200")
    with database_connect() as conn:
        rows=conn.execute(
            """SELECT e.id,e.contact_kind,e.contact_key,e.change_kind,
                      e.source_context,s.source_url,s.captured_on
               FROM court_contact_change_events e
               JOIN court_contact_snapshots s ON s.id=e.newer_snapshot_id
               WHERE e.review_status='pending' ORDER BY e.id LIMIT %s""",(limit,)
        ).fetchall()
    fields=("id","kind","value","change","context","source_url","captured_on")
    return {"items":[dict(zip(fields,r)) for r in rows],"auto_published":0}


def main():
    p=argparse.ArgumentParser(description="Stage offline HTML contact observations for human review only")
    subs=p.add_subparsers(dest="action",required=True)
    st=subs.add_parser("stage")
    st.add_argument("file",type=Path)
    st.add_argument("--watch-id",type=int,required=True)
    st.add_argument("--source-url",required=True)
    st.add_argument("--captured-on",required=True)
    st.add_argument("--reviewer",required=True)
    st.add_argument("--attest-authorized-source",action="store_true")
    q=subs.add_parser("pending")
    q.add_argument("--limit",type=int,default=50)
    args=p.parse_args()
    try:
        if args.action=="pending":
            result=pending(args.limit)
        else:
            if (not args.file.is_file() or args.file.is_symlink()
                or args.file.stat().st_size>MAX_HTML_BYTES):
                raise ImportValidationError("Missing, symlinked or oversized HTML source file")
            result=stage(args.watch_id,args.source_url,args.file.read_bytes(),
                         validated_capture(args.captured_on),args.reviewer,
                         args.attest_authorized_source)
    except (ImportValidationError,OSError) as exc:
        p.exit(2,"Validation error: "+str(exc)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2,default=str))


if __name__=="__main__":
    main()
