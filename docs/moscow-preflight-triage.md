# Read-only Moscow court preflight triage (November 2026)

This report follows successful download of the two private civil JSON exports.
The first 1000 appeal rows included 894 **field-level candidates**, 64 missing
usable lower-case references and 42 invalid/missing UIDs. These are **NOT**
894 confirmed matches with the first-instance dataset.

Previous generic schema diagnostics were easy to misread:
- `judgeTeam: not_a_string` in first-instance rows does NOT imply absence
  of an independent `judge` field or wrong judicial attribution.
- `court_not_in_35` in Moscow City Court appeals is expected, because the
  list of 35 district courts is not an MGS judge roster.
- `lower` from first-instance records is not an appellate link.
- A match to a roster is *technical candidate evidence*, not a reviewed
  judicial act, not proof of current employment and not a safe publication.

This new script reads original JSON *locally only* and emits aggregate counts,
with no field values of courts, participants, judges, URLs, UID or case numbers.

From `/srv/sudy-bulk-work` after `git pull --ff-only`:

```bash
data/import/.moscow-venv/bin/python -m unittest discover -s importer/tests -p 'test_moscow_preflight_triage.py' -v
data/import/.moscow-venv/bin/python importer/moscow_preflight_triage.py --limit 1000
```

The first-instance counts distinguish a missing judge field from a name
that does not unambiguously match the *known* roster of that district court.
Appeal data counts rows with at least one valid lower reference separately
from individual lower-list entries. The sample is the first N rows, so
its percentages cannot be generalized to the full dataset.

No upload to GitHub of actual case data. No `--apply`, `--push` or
Coolify redeploy. Separate later phase: validate dates/results, district
court roster completeness, conflicting record links and actual source terms.
