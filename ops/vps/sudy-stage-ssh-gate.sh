#!/usr/bin/env bash
# Copy to /usr/local/libexec/sudy-stage-ssh-gate (root-owned, chmod 0755)
# and use as OpenSSH authorized_keys forced command for sudy-stage.
# This script MUST NEVER be writable by sudy-stage.
set -Eeuo pipefail
umask 077
request="${SSH_ORIGINAL_COMMAND:-}"
if [[ "$request" =~ ^moscow-preflight[[:space:]]([0-9a-f]{40})$ ]]; then
  sha="${BASH_REMATCH[1]}"
else
  echo "Only moscow-preflight <40-hex-commit> is allowed" >&2
  exit 64
fi
LOCK=/srv/sudy-stage-runner/runner.lock
[[ -d /srv/sudy-stage-runner && ! -L "$LOCK" ]] || {
  echo "Dedicated staging directory missing or unsafe" >&2
  exit 70
}
exec /usr/bin/flock -n "$LOCK" /usr/local/libexec/sudy-stage-preflight "$sha"
