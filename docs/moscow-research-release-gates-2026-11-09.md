# Moscow district courts — evidence readiness gates (9 Nov 2026)

`python3 importer/moscow_research_readiness.py` is a **read-only**, offline
check of the 35 Moscow city district courts. It deliberately distinguishes
historically published rosters from today's judge appointments, register-level
case records from full decision texts, and review queues from approved files.

It audits:
- all 35 district courts must have source-attributed practical information;
- a full roster entry requires individual names and the source URL;
- incomplete rosters are reported explicitly, without guessing names;
- court register links are **not** proof of an appellate outcome;
- a prohibited or pending-publication full text can never enter the
  editorially approved decision dataset;
- the approved full-text file must have actual verification and reuse-rights
  flags, and may not contain duplicate case keys.

Failing the check blocks the publisher's editorial promotion, NOT the website.
The returned JSON holds **counts and court slugs only**, no persons or case text.

Current baseline: 27 courts with historically published judicial rosters,
8 without complete local rosters (five chair-only plus three appointment/
assistant-reference-only), 35 practical-info sections. This is *not*
confirmation of a complete, currently serving bench.

Moscow Oblast is a distinct subject (region 50), and source-attributed
initial cards are kept separately. The official region-50 court directory is
https://usd--mo.sudrf.ru/modules.php?name=sud . Every added reference remains
`noindex` until richer content and source-specific legal review.

Full-text publication must respect Art. 15 of Federal Law 262-FZ and
restrictions on personal data. A link labelled "download" is not proof the
underlying text was fetched or reviewed.

To test:
```bash
python3 -m unittest discover -s importer/tests -p 'test_moscow_research_readiness.py' -v
python3 importer/moscow_research_readiness.py
```

This stage does not touch the VPS database, update raw files, call external
services, push public data, or deploy Coolify.
