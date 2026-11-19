#!/usr/bin/env bash
# Execute on a trusted checkout of sud-court-importer, never inside the public web container.
# No download is attempted: pass locally obtained original official JSON files.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
FIRST=""
APPEAL=""
DO_APPLY=0
DO_PUSH=0
ACK=0
MODE="official"
MAX_COURT=100
MAX_JUDGE=25
usage() {
 cat <<'EOF'
Prepare official Moscow court bulk data without auto-publishing:
  bash scripts/moscow-bulk-release.sh --first /private/first.json [--appeal /private/appeal.json]

After inspecting report.json and the official source terms:
  bash scripts/moscow-bulk-release.sh --first /private/first.json [--appeal /private/appeal.json] \
    --apply --ack-source-terms [--push]

--mode crosschecked: only import cases linked to both first-instance and appellate registers.
--push: commit ONLY apps/web/app/data/moscow-judge-bulk-cases.json and push to
        infra/coolify-russian-vps after --apply. Coolify Redeploy remains manual.
Original JSON files, private SQLite files and participant data are never committed.
EOF
}
while (( $# )); do
 case "$1" in
  --first) FIRST="${2:?Missing --first value}"; shift 2;;
  --appeal) APPEAL="${2:?Missing --appeal value}"; shift 2;;
  --mode) MODE="${2:?Missing mode}"; shift 2;;
  --max-per-court) MAX_COURT="${2:?Missing limit}"; shift 2;;
  --max-per-judge) MAX_JUDGE="${2:?Missing limit}"; shift 2;;
  --apply) DO_APPLY=1; shift;;
  --push) DO_PUSH=1; shift;;
  --ack-source-terms) ACK=1; shift;;
  -h|--help) usage; exit 0;;
  *) echo "Unknown argument: $1" >&2; usage; exit 2;;
 esac
done
[[ -n "$FIRST" && -f "$FIRST" ]] || { echo "Supply the actual locally downloaded first-instance JSON with --first" >&2; exit 2; }
[[ -z "$APPEAL" || -f "$APPEAL" ]] || { echo "Appeal JSON not found" >&2; exit 2; }
[[ "$MODE" == official || "$MODE" == crosschecked ]] || { echo "Invalid mode" >&2; exit 2; }
if (( DO_APPLY )); then
 (( ACK )) || { echo "The source reuse terms must be reviewed before --apply" >&2; exit 2; }
fi
if (( DO_PUSH )); then
 (( DO_APPLY )) || { echo "--push requires --apply" >&2; exit 2; }
 command -v git >/dev/null || { echo "Git is required to push" >&2; exit 2; }
 [[ "$(git branch --show-current)" == "infra/coolify-russian-vps" ]] || {
  echo "Refusing to push: checkout infra/coolify-russian-vps first" >&2; exit 2; }
 [[ -z "$(git diff --cached --name-only)" ]] || { echo "Other files already staged; refusing push" >&2; exit 2; }
 [[ -z "$(git diff --name-only)" ]] || { echo "Tracked changes already present; refusing push" >&2; exit 2; }
fi

command -v python3 >/dev/null || { echo "python3 is required" >&2; exit 2; }
mkdir -p "$ROOT/data/import"
ENV_DIR="$ROOT/data/import/.moscow-venv"
if [[ ! -x "$ENV_DIR/bin/python" ]]; then python3 -m venv "$ENV_DIR"; fi
PY="$ENV_DIR/bin/python"
# Official JSON datasets can be >600 MB; streaming requires ijson.
if ! "$PY" -c 'import ijson' >/dev/null 2>&1; then
 "$PY" -m pip install --disable-pip-version-check 'ijson>=3.2,<4'
fi
STAGE="$(mktemp -d "$ROOT/data/import/moscow-stage.XXXXXXXX")"
echo "Private preflight: $STAGE"
ARGS=(--first "$FIRST" --output "$STAGE/prepared")
if [[ -n "$APPEAL" ]]; then ARGS+=(--appeal "$APPEAL"); fi
"$PY" importer/moscow_bulk_judge_pipeline.py "${ARGS[@]}"
if (( DO_APPLY )); then
 "$PY" - "$STAGE/prepared/report.json" <<'PY_CHECK'
import json,sys
report=json.load(open(sys.argv[1],encoding="utf-8"))
if report["counts"].get("staged",0)<1:
 raise SystemExit("No safe candidates detected. Inspect source schema and quarantine; refusing --apply.")
print("Preflight candidate count:",report["counts"].get("staged",0))
PY_CHECK
fi
echo "Promotion report (no write):"
"$PY" importer/promote_moscow_bulk_metadata.py \
 --prepared "$STAGE/prepared" --mode "$MODE" \
 --max-per-court "$MAX_COURT" --max-per-judge "$MAX_JUDGE"
"$PY" -m unittest discover -s importer/tests -p 'test_moscow_bulk*.py'
if (( DO_APPLY )); then
 "$PY" importer/promote_moscow_bulk_metadata.py \
  --prepared "$STAGE/prepared" --mode "$MODE" \
  --max-per-court "$MAX_COURT" --max-per-judge "$MAX_JUDGE" \
  --apply --ack-source-terms
 echo "Public data JSON updated in this local checkout, NOT deployed."
 if (( DO_PUSH )); then
  TARGET="apps/web/app/data/moscow-judge-bulk-cases.json"
  git add -- "$TARGET"
  STAGED="$(git diff --cached --name-only)"
  [[ "$STAGED" == "$TARGET" ]] || { echo "Unexpected staged paths; refusing to commit" >&2; exit 2; }
  if git diff --cached --quiet; then
   echo "No new public metadata: nothing to commit or push."
  else
   git commit -m "data(moscow): import reviewed official court judge metadata"
   git push origin infra/coolify-russian-vps
  fi
  echo "GitHub updated. Redeploy ONLY sudy-web in Coolify after GitHub CI Success."
 fi
fi
echo "Report: $STAGE/prepared/report.json"
echo "Original exports stay outside GitHub. Do not delete private source/backup files until verified."
