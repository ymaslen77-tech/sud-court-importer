"""Editorial review of judicial appointment records.

Never infer an appointment solely from a person's name.
A current official court roster is evidence to review, not automatic proof
that a dated decree remains in effect or that identical names identify one person.
"""
from __future__ import annotations
import argparse
from datetime import date,datetime,timezone,timedelta
from hashlib import sha256
import json
import re
from contacts import ImportValidationError
from cli import database_connect
from profile import official_url


def cleaned_person(value, field):
    result=" ".join(value.split())
    if not 4<=len(result)<=180 or not re.fullmatch(r"[А-Яа-яЁёA-Za-z .'-]+",result):
        raise ImportValidationError(field+" must be a readable full name")
    return result


def valid_date(value):
    if value is None:return None
    try:
        date_value=date.fromisoformat(value)
    except ValueError as exc:
        raise ImportValidationError("Expected an ISO date") from exc
    if date_value>date.today():
        raise ImportValidationError("Future appointment date not allowed")
    return date_value


def nominate(court_id,full_name,position,source_url,observer,starts_on=None,judge_id=None):
    if not official_url(source_url) or not 2<=len(observer.strip())<=120:
        raise ImportValidationError("Official HTTPS evidence and observer required")
    full_name=cleaned_person(full_name,"Judge")
    position=cleaned_person(position,"Position")
    start=valid_date(starts_on)
    key=json.dumps([court_id,judge_id,full_name,position,str(start)],ensure_ascii=False)
    digest=sha256(key.encode()).hexdigest()
    with database_connect() as conn:
        with conn.transaction():
            if not conn.execute("SELECT 1 FROM courts WHERE id=%s AND status='verified'",(court_id,)).fetchone():
                raise ImportValidationError("Court must be verified")
            if judge_id is not None:
                existing=conn.execute("SELECT full_name FROM judges WHERE id=%s",(judge_id,)).fetchone()
                if existing is None or existing[0]!=full_name:
                    raise ImportValidationError("Explicit judge identity disagrees with stored name")
            source=conn.execute("""INSERT INTO sources(url,publisher,source_type)
                VALUES(%s,%s,%s) ON CONFLICT(url) DO UPDATE SET
                publisher=EXCLUDED.publisher RETURNING id""",
                (source_url,"Официальный судебный источник","judicial-appointment")).fetchone()
            assert source
            row=conn.execute("""INSERT INTO judicial_appointment_candidates
                (court_id,judge_id,full_name,position,starts_on,proposed_action,
                source_id,proposal_sha256)
                VALUES(%s,%s,%s,%s,%s,'appoint',%s,%s)
                ON CONFLICT(court_id,proposal_sha256,source_id)
                DO NOTHING RETURNING id""",
                (court_id,judge_id,full_name,position,start,source[0],digest)).fetchone()
    return {"candidate_id":row[0] if row else None,"created":bool(row),"published":0}


def approve(candidate_id,reviewer,attest_current,attest_identity):
    if not(attest_current and attest_identity):
        raise ImportValidationError("Current assignment and identity attestation required")
    if not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Reviewer required")
    with database_connect() as conn:
        with conn.transaction():
            row=conn.execute("""SELECT p.court_id,p.judge_id,p.full_name,p.position,p.starts_on,
                p.source_id,p.observed_at,p.status,s.url FROM judicial_appointment_candidates p
                JOIN sources s ON s.id=p.source_id WHERE p.id=%s FOR UPDATE OF p""",
                (candidate_id,)).fetchone()
            if row is None or row[7]!="pending":
                raise ImportValidationError("Candidate missing or already reviewed")
            cid,jid,name,position,starts,sid,observed,_,url=row
            if observed < datetime.now(timezone.utc)-timedelta(days=7) or not official_url(url):
                raise ImportValidationError("Source record stale or not official")
            if not conn.execute("SELECT 1 FROM courts WHERE id=%s AND status='verified'",(cid,)).fetchone():
                raise ImportValidationError("Court not verified")
            if jid is None:
                # Explicitly prevent auto-merging and name collision.
                if conn.execute("SELECT 1 FROM judges WHERE full_name=%s LIMIT 1",(name,)).fetchone():
                    raise ImportValidationError("Name collision; resolve judge_id manually before approval")
                created=conn.execute("INSERT INTO judges(full_name) VALUES(%s) RETURNING id",(name,)).fetchone()
                assert created
                jid=created[0]
            else:
                identity=conn.execute("SELECT full_name FROM judges WHERE id=%s FOR UPDATE",(jid,)).fetchone()
                if identity is None or identity[0]!=name:
                    raise ImportValidationError("Judge identity mismatch")
            if conn.execute("""SELECT 1 FROM judicial_appointments
                WHERE judge_id=%s AND court_id=%s AND position=%s
                AND (ends_on IS NULL OR ends_on>=CURRENT_DATE) LIMIT 1""",
                (jid,cid,position)).fetchone():
                raise ImportValidationError("Active appointment already exists")
            appt=conn.execute("""INSERT INTO judicial_appointments
                (judge_id,court_id,position,starts_on,source_id)
                VALUES(%s,%s,%s,%s,%s) RETURNING id""",(jid,cid,position,starts,sid)).fetchone()
            assert appt
            conn.execute("""INSERT INTO change_events
                (entity_type,entity_id,changed_field,old_value,new_value,source_id)
                VALUES('judge',%s,'appointment',NULL,%s,%s)""",
                (jid,str(cid)+": "+position,sid))
            conn.execute("""UPDATE judicial_appointment_candidates
                SET status='approved',reviewer=%s,reviewed_at=now() WHERE id=%s""",
                (reviewer.strip(),candidate_id))
            conn.execute("UPDATE sources SET checked_at=now() WHERE id=%s",(sid,))
    return {"appointment_id":appt[0],"judge_id":jid,"status":"approved"}


def close(appointment_id,ended_on,source_url,reviewer,attest_current):
    if not attest_current or not official_url(source_url):
        raise ImportValidationError("Current official termination evidence required")
    if not 2<=len(reviewer.strip())<=120:
        raise ImportValidationError("Reviewer required")
    end=valid_date(ended_on)
    if end is None:
        raise ImportValidationError("End date required")
    with database_connect() as conn:
        with conn.transaction():
            appt=conn.execute("""SELECT judge_id,court_id,position,starts_on,ends_on
                FROM judicial_appointments WHERE id=%s FOR UPDATE""",(appointment_id,)).fetchone()
            if appt is None or appt[4] is not None:
                raise ImportValidationError("Appointment absent or already closed")
            jid,cid,position,starts,_=appt
            if starts and end<starts:
                raise ImportValidationError("End date before start")
            source=conn.execute("""INSERT INTO sources(url,publisher,source_type)
                VALUES(%s,%s,%s) ON CONFLICT(url)
                DO UPDATE SET publisher=excluded.publisher RETURNING id""",
                (source_url,"Официальный судебный источник","judicial-appointment")).fetchone()
            assert source
            conn.execute("UPDATE judicial_appointments SET ends_on=%s WHERE id=%s",(end,appointment_id))
            conn.execute("""INSERT INTO change_events
                (entity_type,entity_id,changed_field,old_value,new_value,source_id)
                VALUES('judge',%s,'appointment_end',%s,%s,%s)""",
                (jid,str(cid)+": "+position,str(end),source[0]))
            conn.execute("UPDATE sources SET checked_at=now() WHERE id=%s",(source[0],))
    return {"appointment_id":appointment_id,"status":"closed","end_date":str(end)}


def main():
    p=argparse.ArgumentParser(description="Manually reviewed judicial appointments")
    subs=p.add_subparsers(dest="command",required=True)
    proposal=subs.add_parser("nominate")
    proposal.add_argument("--court-id",type=int,required=True)
    proposal.add_argument("--judge-id",type=int)
    proposal.add_argument("--full-name",required=True)
    proposal.add_argument("--position",required=True)
    proposal.add_argument("--starts-on")
    proposal.add_argument("--source-url",required=True)
    proposal.add_argument("--observer",required=True)
    approval=subs.add_parser("approve")
    approval.add_argument("--candidate-id",type=int,required=True)
    approval.add_argument("--reviewer",required=True)
    approval.add_argument("--attest-current",action="store_true")
    approval.add_argument("--attest-identity",action="store_true")
    terminate=subs.add_parser("close")
    terminate.add_argument("--appointment-id",type=int,required=True)
    terminate.add_argument("--ended-on",required=True)
    terminate.add_argument("--source-url",required=True)
    terminate.add_argument("--reviewer",required=True)
    terminate.add_argument("--attest-current",action="store_true")
    a=p.parse_args()
    try:
        if a.command=="nominate":
            result=nominate(a.court_id,a.full_name,a.position,a.source_url,a.observer,a.starts_on,a.judge_id)
        elif a.command=="approve":
            result=approve(a.candidate_id,a.reviewer,a.attest_current,a.attest_identity)
        else:
            result=close(a.appointment_id,a.ended_on,a.source_url,a.reviewer,a.attest_current)
    except ImportValidationError as exc:
        p.exit(2,str(exc)+"\n")
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
