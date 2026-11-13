import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "importer"))
import moscow_source_acceptance as review

BASE = {
    "courtSlug": "tverskoy",
    "field": "expedition_phone",
    "value": "+7 (495) 694-09-24",
    "sourceUrl": "https://mos-gorsud.ru/rs/tverskoj/help/hours",
    "sourceKind": "official_court_page",
    "issuer": "Тверской районный суд",
    "sourcePublishedOn": "2026-06-24",
    "capturedOn": "2026-11-09",
    "snapshotSha256": "a" * 64,
}

class OfficialFactReviewTests(unittest.TestCase):
    def test_distinct_issuers_and_documents_required(self):
        court_page = dict(BASE)
        other = dict(BASE, sourceUrl="https://mos-gorsud.ru/mgs/news/dated-fact",
                     issuer="Московский городской суд", snapshotSha256="b"*64,
                     value="8 (495) 694-09-24")
        result = review.review([court_page, other])
        self.assertEqual(result["states"], {"auto_concordant_official_evidence": 1})
        self.assertFalse(result["automaticPublication"])
        self.assertNotIn("+7 (495)", str(result))
        duplicate = dict(other, issuer=BASE["issuer"])
        result = review.review([court_page, duplicate])
        self.assertEqual(result["states"], {"single_issuer_or_source_requires_review": 1})

    def test_conflicting_official_records_are_held(self):
        bad = dict(BASE, value="+7 (495) 694-09-25", issuer="Московский городской суд",
                   sourceUrl="https://mos-gorsud.ru/mgs/news/new", snapshotSha256="b"*64)
        result = review.review([BASE, bad])
        self.assertEqual(result["states"], {"conflicting_official_sources_hold": 1})
        self.assertTrue(result["facts"][0]["sourceConflict"])

    def test_single_official_is_not_auto_accepted(self):
        result = review.review([BASE])
        self.assertEqual(result["states"], {"single_issuer_or_source_requires_review": 1})

    def test_reject_fake_domains_and_bad_sources(self):
        self.assertFalse(review.is_official("https://mos-gorsud.ru.bad.example/rs"))
        self.assertFalse(review.is_official("http://mos-gorsud.ru/rs"))
        self.assertFalse(review.is_official("https://attacker@mos-gorsud.ru/rs"))
        self.assertFalse(review.is_official("https://mos-gorsud.ru:44/rs"))
        result = review.review([dict(BASE, field="participants"),
                                dict(BASE, snapshotSha256="invalid")])
        self.assertEqual(result["excluded"]["field_not_allowed"], 1)
        self.assertEqual(result["excluded"]["missing_snapshot_hash"], 1)

    def test_official_vs_nonofficial_conflict_is_flagged(self):
        nonofficial = dict(BASE, sourceUrl="https://random.example.com/claim",
                           sourceKind="nonofficial", issuer="Unknown",
                           value="+7 (495) 694-09-21", snapshotSha256="b"*64)
        result = review.review([BASE, nonofficial])
        self.assertEqual(result["states"], {"official_preferred_nonofficial_conflict_review": 1})
        self.assertNotIn("694-09-21", str(result))


if __name__ == "__main__":
    unittest.main()
