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


## Extended official Moscow Oblast directory — 9 November 2026

The official Judicial Department's public directory
https://usd--mo.sudrf.ru/modules.php?name=sud includes a Moscow oblast
regional court and district/city courts. The project now has 45
region-50 basic **reference** cards, including 30 added in this
pass. An independently maintained rich profile of Pushkinsky city court
is kept as a separate dossier and is NOT duplicated in the basic cards.

Official directories are not real-time guarantees of unchanged opening hours,
accessibility, premises, court composition or territorial jurisdiction. Several
entries include two addresses and offices; the user is instructed to check the
correct building by case notice. Names and primary phones copied from the
official directory are historical official publications, not freshly verified
with all individual courts.

The directory contains rare transcription typos. The normalized spelling of the
court type is not evidence of a new court or changed jurisdiction. Do not add
synthetic case records or full-text legal conclusions to these source cards.

After directory data is fully cross-checked against individual court websites,
consider lifting noindex only for sufficiently substantive, editorially reviewed
cards. Leave fake, thin or contradictory material noindex.
