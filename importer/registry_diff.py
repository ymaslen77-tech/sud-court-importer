"""Compare two official court snapshots; never auto-publish changes."""
from __future__ import annotations
import argparse
from dataclasses import dataclass
import json
from pathlib import Path

from contacts import ImportValidationError, MAX_BYTES
from cli import database_connect
from federation import parse_export

FIELDS=("court_name","court_type","address","phone","email","official_url")

@dataclass(frozen=True)
class Difference:
    code:str
    field:str
    kind:str
    before:str|None
    after:str|None

    def as_dict(self):
        return vars(self)


def compare(old:dict,new:dict,include_missing=False):
    changes=[]
    for code in sorted(old.keys()|new.keys()):
        before,after=old.get(code),new.get(code)
        if before is None:
            changes.append(Difference(code,"__record__","new",None,
                json.dumps(after,ensure_ascii=False,sort_keys=True)))
        elif after is None and include_missing:
            changes.append(Difference(code,"__record__","missing",
                json.dumps(before,ensure_ascii=False,sort_keys=True),None))
        else:
            for field in FIELDS:
                a,b=before.get(field),after.get(field)
                if a!=b:changes.append(Difference(code,field,"changed",a,b))
    return changes


def listing_file(path,registry):
    if not path.is_file() or path.stat().st_size>MAX_BYTES:
        raise ImportValidationError("Missing or oversized official snapshot")
    rows=parse_export(path.read_bytes(),registry)
    urls={r.source_record_url for r in rows}
    if len(urls)!=1:raise ImportValidationError("One snapshot must refer to one official listing")
    return next(iter(urls)),{
        r.record.external_code:{
            "court_name":r.record.name,"court_type":r.record.court_type,
            "address":r.record.address,"phone":r.record.phone,
            "email":r.record.email,"official_url":r.record.official_url
        } for r in rows
    }


def from_database(conn,batch):
    info=conn.execute(
        "SELECT source_id,staged_at FROM court_import_batches WHERE id=%s",(batch,)
    ).fetchone()
    if not info:raise ImportValidationError("Court import batch not found")
    rows=conn.execute(
        """SELECT external_code,court_name,court_type,address,phone,email,official_url
           FROM court_import_rows WHERE batch_id=%s""",(batch,)
    ).fetchall()
    if not rows:raise ImportValidationError("Cannot compare empty batch")
    return info,{r[0]:dict(zip(FIELDS,r[1:])) for r in rows}


def queue(older_id,newer_id,attest_complete=False,reviewer=None):
    if older_id==newer_id:raise ImportValidationError("Cannot compare same batch")
    if attest_complete and (not reviewer or not 2<=len(reviewer.strip())<=120):
        raise ImportValidationError("Complete snapshots require a named reviewer")
    with database_connect() as conn:
        with conn.transaction():
            old_info,old=from_database(conn,older_id)
            new_info,new=from_database(conn,newer_id)
            if old_info[0]!=new_info[0]:
                raise ImportValidationError("Cross-source comparisons are forbidden")
            if old_info[1]>new_info[1]:
                raise ImportValidationError("Snapshot order is reversed")
            changes=compare(old,new,include_missing=attest_complete)
            newrun=conn.execute(
                """INSERT INTO court_registry_diff_runs
                (source_id,older_batch_id,newer_batch_id,include_absences,completeness_asserted_by)
                VALUES(%s,%s,%s,%s,%s) ON CONFLICT(older_batch_id,newer_batch_id)
                DO NOTHING RETURNING id""",
                (old_info[0],older_id,newer_id,attest_complete,reviewer.strip() if attest_complete else None)
            ).fetchone()
            if newrun:
                run_id=newrun[0]
                for d in changes:
                    conn.execute(
                        """INSERT INTO court_registry_diff_items
                        (run_id,external_code,field_name,change_kind,old_value,new_value)
                        VALUES(%s,%s,%s,%s,%s,%s)""",
                        (run_id,d.code,d.field,d.kind,d.before,d.after)
                    )
            else:
                prev=conn.execute(
                    """SELECT id FROM court_registry_diff_runs
                       WHERE older_batch_id=%s AND newer_batch_id=%s""",
                    (older_id,newer_id)
                ).fetchone()
                assert prev
                run_id=prev[0]
    return {"run_id":run_id,"created":bool(newrun),"differences":len(changes),
        "new":sum(d.kind=="new" for d in changes),
        "missing":sum(d.kind=="missing" for d in changes),
        "changed_fields":sum(d.kind=="changed" for d in changes),"auto_published":0}


def pending(limit):
    if not 1<=limit<=200:raise ImportValidationError("Limit must be 1-200")
    with database_connect() as conn:
        rows=conn.execute(
            """SELECT id,run_id,external_code,field_name,change_kind,old_value,new_value
               FROM court_registry_diff_items WHERE review_status='pending'
               ORDER BY id LIMIT %s""",(limit,)
        ).fetchall()
    return {"pending_in_page":len(rows),"items":[dict(zip(
        ("id","run_id","code","field","kind","before","after"),r
    )) for r in rows],"auto_published":0}


def acknowledge(item_id,reviewer,attested,ignore):
    if not attested or not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Reviewer and explicit attestation required")
    with database_connect() as conn:
        with conn.transaction():
            row=conn.execute(
                """UPDATE court_registry_diff_items SET review_status=%s,
                reviewed_by=%s,reviewed_at=now()
                WHERE id=%s AND review_status='pending' RETURNING id""",
                ("ignored" if ignore else "reviewed",reviewer.strip(),item_id)
            ).fetchone()
            if not row:raise ImportValidationError("Pending diff item not found")
    return {"id":item_id,"review_status":"ignored" if ignore else "reviewed",
            "auto_published":0}


def main():
    p=argparse.ArgumentParser(description="Review-only official court snapshot diffs")
    sub=p.add_subparsers(dest="action",required=True)
    local=sub.add_parser("compare")
    local.add_argument("older",type=Path)
    local.add_argument("newer",type=Path)
    local.add_argument("--registry",required=True)
    local.add_argument("--attest-both-complete",action="store_true")
    db=sub.add_parser("queue")
    db.add_argument("--older-batch",type=int,required=True)
    db.add_argument("--newer-batch",type=int,required=True)
    db.add_argument("--attest-both-complete",action="store_true")
    db.add_argument("--reviewer")
    wait=sub.add_parser("pending")
    wait.add_argument("--limit",type=int,default=100)
    ack=sub.add_parser("acknowledge")
    ack.add_argument("--item-id",type=int,required=True)
    ack.add_argument("--reviewer",required=True)
    ack.add_argument("--attest-reviewed",action="store_true")
    ack.add_argument("--ignore",action="store_true")
    args=p.parse_args()
    try:
        if args.action=="compare":
            old_url,old=listing_file(args.older,args.registry)
            new_url,new=listing_file(args.newer,args.registry)
            if old_url!=new_url:
                raise ImportValidationError("Comparison requires same official URL")
            changes=compare(old,new,include_missing=args.attest_both_complete)
            result={"differences":len(changes),
                    "new":sum(x.kind=="new" for x in changes),
                    "missing":sum(x.kind=="missing" for x in changes),
                    "changed_fields":sum(x.kind=="changed" for x in changes),
                    "items":[x.as_dict() for x in changes],"auto_published":0}
        elif args.action=="queue":
            result=queue(args.older_batch,args.newer_batch,args.attest_both_complete,args.reviewer)
        elif args.action=="pending":
            result=pending(args.limit)
        else:
            result=acknowledge(args.item_id,args.reviewer,args.attest_reviewed,args.ignore)
    except ImportValidationError as exc:
        p.exit(2,"Validation error: "+str(exc)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
