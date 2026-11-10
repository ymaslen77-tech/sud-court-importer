#!/usr/bin/env bash
# ONE-TIME privileged installer. Read this file and the official source terms
# before use. Does NOT download or import cases, create a deployment or modify
# production application/database. Requires a locally held PUBLIC SSH key file.
set -Eeuo pipefail
umask 077
if (( EUID != 0 )) || (( $# != 1 )); then
  echo "Usage (as root): bash ops/vps/install-moscow-operator.sh /path/to/ssh_key.pub" >&2
  exit 64
fi
PUBKEY="$1"
[[ -f "$PUBKEY" && ! -L "$PUBKEY" ]] || { echo "Only a local public key file is accepted" >&2; exit 64; }
for program in useradd runuser git install setfacl ssh-keygen; do
  command -v "$program" >/dev/null || { echo "Missing required tool: $program" >&2;exit 69; }
done
ssh-keygen -lf "$PUBKEY" >/dev/null
pub="$(cat -- "$PUBKEY")"
[[ "$pub" =~ ^ssh-ed25519[[:space:]][A-Za-z0-9+/=]+([[:space:]][a-zA-Z0-9_.@-]+)?$ ]] || {
 echo "Expected one ed25519 public key, with no additional shell options" >&2;exit 64;
}
id sudy-stage >/dev/null 2>&1 && { echo "sudy-stage already exists; inspect manually instead of overwriting" >&2;exit 64; }
ROOT=/srv/sudy-stage-runner
FIRST=/srv/sudy-private/moscow-open-data/1577116594824-casesgroupfirstcivilhxvgb.json
APPEAL=/srv/sudy-private/moscow-open-data/1577117744056-casesgroupmgsappealcivilwtxga.json
[[ -f "$FIRST" && -f "$APPEAL" && ! -L "$FIRST" && ! -L "$APPEAL" ]] || {
 echo "Verified original JSON files missing or unsafe" >&2;exit 66;
}
[[ ! -e "$ROOT" ]] || { echo "Staging operator directory already exists; inspect first" >&2;exit 64; }
[[ -d /srv/sudy-private/moscow-open-data && -d /srv/sudy-private ]] || exit 66

useradd --system --user-group --create-home --home-dir /home/sudy-stage --shell /bin/bash sudy-stage
# Mark password hash as unusable, without marking the *account* locked.
# Some OpenSSH configurations reject locked accounts before evaluating
# authorized_keys. A literal '*' cannot match any UNIX password.
usermod --password '*' sudy-stage
[[ "$(getent shadow sudy-stage | cut -d: -f2)" == '*' ]] || {
  echo "Failed to mark the service account password unusable" >&2; exit 70;
}
install -d -o sudy-stage -g sudy-stage -m 0700 "$ROOT"
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g root -m 0755 ops/vps/sudy-stage-ssh-gate.sh /usr/local/libexec/sudy-stage-ssh-gate
install -o root -g root -m 0755 ops/vps/sudy-stage-preflight.sh /usr/local/libexec/sudy-stage-preflight

# The SSH key and home tree are root-owned, so a repository script running
# as sudy-stage cannot remove the SSH forced-command restriction.
install -d -o root -g root -m 0755 /home/sudy-stage/.ssh
printf 'restrict,command="/usr/local/libexec/sudy-stage-ssh-gate" %s\n' "$pub" > /home/sudy-stage/.ssh/authorized_keys
chown root:root /home/sudy-stage/.ssh/authorized_keys /home/sudy-stage/.ssh /home/sudy-stage
chmod 0755 /home/sudy-stage /home/sudy-stage/.ssh
chmod 0644 /home/sudy-stage/.ssh/authorized_keys

# Grant this non-root user READ access to only the two named private JSONs.
# Directory traversal is allowed, but general listing is not.
setfacl -m u:sudy-stage:--x /srv/sudy-private /srv/sudy-private/moscow-open-data
setfacl -m u:sudy-stage:r-- "$FIRST" "$APPEAL"

runuser -u sudy-stage -- git clone --quiet --single-branch \
  --branch infra/coolify-russian-vps \
  https://github.com/ymaslen77-tech/sud-court-importer.git \
  "$ROOT/sud-court-importer"
# Only the dedicated worktree is writable by sudy-stage; no sudo/docker group.
runuser -u sudy-stage -- test -r "$FIRST"
runuser -u sudy-stage -- test -r "$APPEAL"
echo "Operator installed with a fixed root-owned SSH gate. No import or Deploy performed."
echo "Add the matching PRIVATE key directly to GitHub environment vps-stage secrets."
echo "Pin the server's real SSH host key in SUDY_VPS_KNOWN_HOSTS; never paste keys in chat."
