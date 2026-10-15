"""Review-only comparison of two official court staffing snapshots.

Presence is not proof of appointment; absence is not proof of termination.
No changes are made to public courts or judicial_appointments.
"""
from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
from datetime import date
import json
from pathlib import Path

from cli import database_connect
from contacts import ImportValidationError, MAX_BYTES

ATTRIBUTES = ("decree_number", "decree_date", "room", "telephone")
ALIASES = {"decree_number": "decreeNumber", "decree_date": "decreeDate"}


@dataclass(frozen=True)
class Difference:
    subject_key: str
    full_name: str
    field_name: str
    kind: str
    before: str | None
    after: str | None


def normalize(rows: list[dict]) -> dict[tuple[str, str], dict]:
    result = {}
    for row in rows:
        name = row.get("full_name", row.get("fullName"))
        role = row.get("stated_position", row.get("position"))
        if not isinstance(name, str) or not isinstance(role, str) or not name or not role:
            raise ImportValidationError("Invalid roster person or position")
        key = (name, role)
        if key in result:
            raise ImportValidationError("Duplicate name/position in roster")
        result[key] = {}
        for field in ATTRIBUTES:
            value = row.get(field, row.get(ALIASES.get(field, field)))
            result[key][field] = None if value is None else str(value)
    if not result:
        raise ImportValidationError("Empty snapshot cannot prove removals")
    return result


def compare(older: list[dict], newer: list[dict]) -> list[Difference]:
    old, new = normalize(older), normalize(newer)
    changes: list[Difference] = []
    # Name+position is a row key for the source, not an identity assertion.
    # A changed role produces two observations, never an automatic appointment.
    for key in sorted(old.keys() & new.keys()):
        for field in ATTRIBUTES:
            before, after = old[key][field], new[key][field]
            if before != after:
                changes.append(Difference(json.dumps(key, ensure_ascii=False), key[0],
                                          field, "field_changed", before, after))
    for key in sorted(new.keys() - old.keys()):
        changes.append(Difference(json.dumps(key, ensure_ascii=False), key[0],
                                  "__row__", "first_listed", None,
                                  json.dumps(new[key], ensure_ascii=False, sort_keys=True)))
    for key in sorted(old.keys() - new.keys()):
        changes.append(Difference(json.dumps(key, ensure_ascii=False), key[0],
                                  "__row__", "no_longer_listed",
                                  json.dumps(old[key], ensure_ascii=False, sort_keys=True), None))
    return sorted(changes, key=lambda c: (c.full_name, c.subject_key, c.field_name))


def read_batch(conn, batch_id: int) -> tuple[tuple, list[dict]]:
    meta = conn.execute(
        """SELECT source_id,official_court_url,captured_on FROM court_staff_roster_batches
           WHERE id=%s""", (batch_id,)).fetchone()
    if meta is None:
        raise ImportValidationError("Roster batch not found")
    columns = ("full_name", "stated_position", "decree_number",
               "decree_date", "room", "telephone")
    records = conn.execute(
        """SELECT full_name,stated_position,decree_number,decree_date,room,telephone
           FROM court_staff_roster_rows WHERE batch_id=%s ORDER BY id""",
        (batch_id,)).fetchall()
    return meta, [dict(zip(columns, record)) for record in records]


def queue(older_batch_id: int, newer_batch_id: int) -> dict:
    if older_batch_id <= 0 or newer_batch_id <= 0 or older_batch_id == newer_batch_id:
        raise ImportValidationError("Distinct positive snapshot identifiers required")
    with database_connect() as conn:
        with conn.transaction():
            older_info, older = read_batch(conn, older_batch_id)
            newer_info, newer = read_batch(conn, newer_batch_id)
            if older_info[:2] != newer_info[:2]:
                raise ImportValidationError("Cross-court or cross-source comparison denied")
            if (older_info[2], older_batch_id) >= (newer_info[2], newer_batch_id):
                raise ImportValidationError("Snapshot order is not chronological")
            changes = compare(older, newer)
            inserted = conn.execute(
                """INSERT INTO court_staff_roster_diff_runs(older_batch_id,newer_batch_id)
                   VALUES(%s,%s) ON CONFLICT (older_batch_id,newer_batch_id)
                   DO NOTHING RETURNING id""",
                (older_batch_id, newer_batch_id)).fetchone()
            if inserted:
                run_id = inserted[0]
                for change in changes:
                    conn.execute(
                        """INSERT INTO court_staff_roster_diff_items(
                           run_id,subject_key,full_name,field_name,change_kind,old_value,new_value)
                           VALUES(%s,%s,%s,%s,%s,%s,%s)""",
                        (run_id, change.subject_key, change.full_name,
                         change.field_name, change.kind, change.before, change.after))
            else:
                found = conn.execute(
                    """SELECT id FROM court_staff_roster_diff_runs
                       WHERE older_batch_id=%s AND newer_batch_id=%s""",
                    (older_batch_id, newer_batch_id)).fetchone()
                assert found
                run_id = found[0]
    return {"run_id": run_id, "created": bool(inserted),
            "differences": len(changes), "auto_published": 0, "appointments_mutated": 0}


def pending(limit: int = 50) -> dict:
    if not 1 <= limit <= 200:
        raise ImportValidationError("Review limit must be 1-200")
    with database_connect() as conn:
        rows = conn.execute(
            """SELECT d.id,r.older_batch_id,r.newer_batch_id,d.full_name,
               d.field_name,d.change_kind,d.old_value,d.new_value,
               b.official_court_url,s.url
               FROM court_staff_roster_diff_items d
               JOIN court_staff_roster_diff_runs r ON r.id=d.run_id
               JOIN court_staff_roster_batches b ON b.id=r.newer_batch_id
               JOIN sources s ON s.id=b.source_id
               WHERE d.review_status='pending' ORDER BY d.id LIMIT %s""",
            (limit,)).fetchall()
    keys = ("id", "older_batch_id", "newer_batch_id", "name", "field",
            "kind", "before", "after", "court_url", "source_url")
    return {"items": [dict(zip(keys, row)) for row in rows], "auto_published": 0}


def acknowledge(item_id: int, reviewer: str, attested: bool, ignore: bool = False) -> dict:
    if item_id <= 0 or not attested or not isinstance(reviewer, str) or not 2 <= len(reviewer.strip()) <= 120:
        raise ImportValidationError("Named reviewer and explicit review attestation required")
    with database_connect() as conn:
        with conn.transaction():
            found = conn.execute(
                """UPDATE court_staff_roster_diff_items SET review_status=%s,
                   reviewed_by=%s,reviewed_at=now()
                   WHERE id=%s AND review_status='pending' RETURNING id""",
                ("ignored" if ignore else "reviewed", reviewer.strip(), item_id)).fetchone()
            if found is None:
                raise ImportValidationError("Pending change not found")
    return {"id": item_id, "status": "ignored" if ignore else "reviewed",
            "appointments_mutated": 0}


def compare_files(older: Path, newer: Path) -> dict:
    from roster import parse
    def load(path: Path) -> dict:
        if not path.is_file() or path.stat().st_size > MAX_BYTES:
            raise ImportValidationError("Missing or oversized roster file")
        return parse(path.read_bytes())
    a, b = load(older), load(newer)
    if a["sourceUrl"] != b["sourceUrl"] or a["courtUrl"] != b["courtUrl"]:
        raise ImportValidationError("Different court or official source")
    return {"items": [asdict(x) for x in compare(a["judges"], b["judges"])],
            "auto_published": 0}


def main():
    p = argparse.ArgumentParser(description="Human-reviewed staff-roster differences")
    sub = p.add_subparsers(dest="action", required=True)
    local = sub.add_parser("compare")
    local.add_argument("older", type=Path)
    local.add_argument("newer", type=Path)
    q = sub.add_parser("queue")
    q.add_argument("--older-batch", type=int, required=True)
    q.add_argument("--newer-batch", type=int, required=True)
    pending_cmd = sub.add_parser("pending")
    pending_cmd.add_argument("--limit", type=int, default=50)
    ack = sub.add_parser("acknowledge")
    ack.add_argument("--item-id", type=int, required=True)
    ack.add_argument("--reviewer", required=True)
    ack.add_argument("--attest-reviewed", action="store_true")
    ack.add_argument("--ignore", action="store_true")
    a = p.parse_args()
    try:
        if a.action == "compare":
            result = compare_files(a.older, a.newer)
        elif a.action == "queue":
            result = queue(a.older_batch, a.newer_batch)
        elif a.action == "pending":
            result = pending(a.limit)
        else:
            result = acknowledge(a.item_id, a.reviewer, a.attest_reviewed, a.ignore)
    except (ImportValidationError, OSError) as exc:
        p.exit(2, "Validation error: " + str(exc) + "\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
