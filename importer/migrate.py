"""Apply ordered court schema migrations to an explicitly selected PostgreSQL DB.

Usage:
  python importer/migrate.py --list
  DATABASE_URL=... python importer/migrate.py --check
  DATABASE_URL=... python importer/migrate.py --apply --confirm

Does not import or approve any court records.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / "db" / "migrations"
PATTERN = re.compile(r"^[0-9]{3}_[a-z0-9_]+\.sql$")


def migration_files(directory: Path = ROOT) -> list[Path]:
    if not directory.is_dir() or directory.is_symlink():
        raise ValueError("Migration directory missing or unsafe")
    files = sorted(directory.glob("*.sql"), key=lambda f: f.name)
    if not files:
        raise ValueError("No migrations found")
    names: set[str] = set()
    for file in files:
        if file.is_symlink() or not PATTERN.fullmatch(file.name):
            raise ValueError("Unsafe migration filename or symlink")
        if file.name in names or file.stat().st_size > 1_000_000:
            raise ValueError("Duplicate or oversized migration")
        names.add(file.name)
        if not file.read_bytes().strip():
            raise ValueError("Empty migration: " + file.name)
    return files


def list_migrations(directory: Path = ROOT) -> list[dict]:
    return [{"name": f.name, "sha256": sha256(f.read_bytes()).hexdigest()}
            for f in migration_files(directory)]


def run(*, apply: bool, directory: Path = ROOT) -> dict:
    import os
    import psycopg
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL is required; do not print its value")
    manifest = list_migrations(directory)
    with psycopg.connect(url, connect_timeout=10, autocommit=True) as conn:
        # Session-scoped lock holds across per-file transactions.
        conn.execute("SELECT pg_advisory_lock(1602202610)")
        try:
            if apply:
                with conn.transaction():
                    conn.execute("""
                        CREATE TABLE IF NOT EXISTS court_schema_migrations (
                          filename TEXT PRIMARY KEY,
                          sha256 TEXT NOT NULL,
                          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
                        )
                    """)
            exists = conn.execute("""
                SELECT to_regclass('public.court_schema_migrations') IS NOT NULL
            """).fetchone()[0]
            applied = {}
            if exists:
                applied = dict(conn.execute(
                    "SELECT filename,sha256 FROM court_schema_migrations ORDER BY filename"
                ).fetchall())
            current = {x["name"]:x["sha256"] for x in manifest}
            unknown = set(applied) - set(current)
            if unknown:
                raise ValueError("DB has unknown historical migrations: " + ", ".join(sorted(unknown)))
            for filename, expected in applied.items():
                if expected != current[filename]:
                    raise ValueError("Migration hash mismatch: " + filename)
            # Don't permit a new migration to run before older missing files.
            saw_missing = False
            for entry in manifest:
                if entry["name"] not in applied:
                    saw_missing = True
                elif saw_missing:
                    raise ValueError("Migration history contains an out-of-order gap")
            pending = [item for item in manifest if item["name"] not in applied]
            if apply:
                for entry in pending:
                    sql = (directory / entry["name"]).read_text(encoding="utf-8")
                    with conn.transaction():
                        conn.execute(sql)
                        conn.execute(
                            "INSERT INTO court_schema_migrations(filename,sha256) VALUES(%s,%s)",
                            (entry["name"],entry["sha256"])
                        )
            return {"mode":"apply" if apply else "check", "schema_files":len(manifest),
                    "already_applied":len(applied), "pending":len(pending),
                    "applied_now":len(pending) if apply else 0,
                    "court_records_published":0}
        finally:
            conn.execute("SELECT pg_advisory_unlock(1602202610)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Versioned, checksum-verified PostgreSQL migrations")
    parser.add_argument("--list", action="store_true", help="Print only names and hashes (no DB)")
    parser.add_argument("--check", action="store_true", help="Read current migration status")
    parser.add_argument("--apply", action="store_true", help="Apply pending migrations transactionally")
    parser.add_argument("--confirm", action="store_true", help="Mandatory flag for schema changes")
    args = parser.parse_args()
    if sum([args.list,args.check,args.apply]) != 1:
        parser.error("Choose exactly one of --list, --check, --apply")
    if args.apply and not args.confirm:
        parser.error("Use --apply --confirm to change an existing PostgreSQL schema")
    import json
    try:
        output = list_migrations() if args.list else run(apply=args.apply)
        print(json.dumps(output,ensure_ascii=False,indent=2))
    except (ValueError, OSError) as exc:
        parser.exit(2, str(exc) + "\n")


if __name__ == "__main__":
    main()
