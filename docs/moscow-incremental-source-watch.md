# Controlled incremental source monitoring (Moscow open data)

This is a **metadata-only** change detector for official Moscow open-data
archives. It does not download decisions, republish case records, interpret
court outcomes, or attest that two same-sized archives have identical content.

Initial run on VPS (AFTER independent review of the official reuse terms):

```bash
cd /srv/sudy-bulk-work
data/import/.moscow-venv/bin/python importer/moscow_source_watch.py \
  --scope eligible \
  --only 1577116594824-casesgroupfirstcivilhxvgb 1577117744056-casesgroupmgsappealcivilwtxga \
  --ack-source-terms
```

State is kept privately outside Git:
`/srv/sudy-private/moscow-open-data/source-watch.json` mode 0600.
A later invocation compares source HTTP metadata with the saved baseline.

- `first_observation`: baseline only, NOT a new case.
- `metadata_changed_review_needed`: re-download after manual rights/schema
  checks; never silently overwrite a trusted snapshot.
- `metadata_unchanged_not_content_verified`: only strong-ish header signal,
  not proof the cases stayed unchanged.
- `insufficient_change_signal`: no ETag/Last-Modified; no valid conclusion.

All HTTP queries use HEAD and require the exact HTTPS host. Redirects,
unsupported content types, missing content length, or network failures block
the update and preserve the previous state. Limit requests per run (2 by
default). The dataset catalog includes more than civil cases, but those
require separate schema mapping and legal acceptance before import.

After source change is reviewed, run
`scripts/moscow-bulk-release.sh` **without** `--apply` on explicitly
acquired JSON files and inspect the private report. This source monitor
does not replace the judgment-review gate or the official roster check.

This is preparation for periodic monitoring; no cron/systemd timer,
GitHub scheduled workflow, or VPS background process is installed
by these repository changes. The owner can activate the documented
command after source rights and server resource limits have been accepted.
