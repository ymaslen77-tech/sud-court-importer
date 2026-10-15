# UI / Information Architecture — Courts of Russia

## Design direction
- Strict editorial style: white, graphite, muted surfaces and restrained red accents.
- Responsive desktop / tablet / mobile layout.
- Semantic HTML, accessible labels, keyboard focus indicators and reduced-motion support.
- No invented court statistics, judges, appointments or official seals.

## Public navigation
| Route | Purpose | Initial data / SEO state |
|---|---|---|
| `/` | Hero, court name search, services map, methodology | Informational |
| `/courts` | Browse published regions / courts | noindex until verified regions exist |
| `/courts/:region` | Verified courts in the selected region | noindex when empty |
| `/courts/:region/:court` | Verified court contacts | noindex without a verified address |
| `/search?q=` | Search by court name, at most 25 matches | noindex |
| `/judges` | Judges and appointments concept | noindex until real records |
| `/laws` | Code / legislation concept | noindex until real records |
| `/practice` | Judicial acts concept | noindex until real records |
| `/jurisdiction` | Address / proceedings jurisdiction concept | noindex; NOT a working decision engine |
| `/guides` | Process and documentation concept | noindex until reviewed guidance |
| `/services` | Legal documents and calculators concept | noindex until live tools |
| `/sources` | Transparency and official source links | Editorial content |

## Verified search
- `GET /api/v1/courts/search?q=` validates 2–100 characters.
- Case-insensitive literal partial matches on names, not full text or address.
- Returns only `verified` courts, max 25 records, with region metadata.
- When an error occurs, a distinct unavailability message appears instead of falsely showing zero results.
- Regions are listed only when at least one verified court is attached.
- Production-scale search, pagination, source-level attribution, and regional search facets are separate tasks.

## Content standards
- Each published fact needs a verified official source, a check date and a correction process.
- A court chairman is not necessarily the presiding judge in an individual case.
- An absent or unknown value is never rendered as a guessed placeholder.
- Court location alone is insufficient to determine jurisdiction.
- Never claim document submission to court is implemented before officially validated.

## Next milestones
1. Import verified official Moscow court data into staging with deduplication.
2. Add source attribution per rendered contact fact and an administrator review queue.
3. Implement verified judge appointments and court-level judge roster.
4. Replace name substring search with a scalable search index when justified.
5. Build address jurisdiction model and legal reference versioning with tests.
6. Add crawlable sitemaps only for complete confirmed records and smoke tests for rendered metadata.
