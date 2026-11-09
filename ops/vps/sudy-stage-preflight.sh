#!/usr/bin/env bash
# Root-owned installed copy at /usr/local/libexec/sudy-stage-preflight.
# Runs as a dedicated non-root account. Does NOT apply, push or deploy.
set -Eeuo pipefail
umask 077
sha="${1:-}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "Invalid commit SHA" >&2; exit 64; }
WORK=/srv/sudy-stage-runner/sud-court-importer
FIRST=/srv/sudy-private/moscow-open-data/1577116594824-casesgroupfirstcivilhxvgb.json
APPEAL=/srv/sudy-private/moscow-open-data/1577117744056-casesgroupmgsappealcivilwtxga.json
[[ -d "$WORK/.git" && -r "$FIRST" && -r "$APPEAL" ]] || {
  echo "Read-only inputs or trusted operator checkout not prepared" >&2; exit 66;
}
[[ ! -L "$FIRST" && ! -L "$APPEAL" ]] || {
  echo "Original data must not be symbolic links" >&2; exit 66;
}
case "$(git -C "$WORK" remote get-url origin)" in
  https://github.com/ymaslen77-tech/sud-court-importer|https://github.com/ymaslen77-tech/sud-court-importer.git)
    ;;
  *) echo "Unexpected Git origin. Refusing to execute" >&2; exit 66;;
esac
# The requested SHA MUST be a commit on the known work branch.
git -C "$WORK" fetch --quiet origin   +refs/heads/infra/coolify-russian-vps:refs/remotes/origin/infra/coolify-russian-vps
git -C "$WORK" merge-base --is-ancestor "$sha" refs/remotes/origin/infra/coolify-russian-vps || {
 echo "Requested commit is not on the expected branch" >&2;exit 66;
}
[[ -z "$(git -C "$WORK" status --porcelain --untracked-files=no)" ]] || {
 echo "Staging checkout contains tracked changes; refusing to overwrite" >&2;exit 66;
}
git -C "$WORK" checkout --quiet --detach "$sha"
# These checks run on the SAME commit as the pending SSH job.
python3 "$WORK/ops/vps/validate_request.py" "$WORK/ops/vps/request.json" >/dev/null
python3 -m unittest discover -s "$WORK/importer/tests" -p 'test_moscow_bulk_judge_pipeline.py' -q
# Bound disk resource use. 12 GiB is a floor, NOT an estimate of input size.
free_kib="$(df -Pk "$WORK" | awk 'END {print $4}')"
if [[ ! "$free_kib" =~ ^[0-9]+$ || "$free_kib" -lt 12582912 ]]; then
  echo "Less than 12 GiB free; stopped before reading exports" >&2
  exit 75
fi
cd "$WORK"
echo "PRIVATE_PREFLIGHT_START sha=$sha"
bash scripts/moscow-bulk-release.sh --first "$FIRST" --appeal "$APPEAL" --mode crosschecked
echo "PRIVATE_PREFLIGHT_DONE no_apply=true no_git_push=true no_deploy=true"
