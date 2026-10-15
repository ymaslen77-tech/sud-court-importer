"""No database and no networking: court-site migration publication safety."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from verification import review_official_site

OLD = "http://barabinsky.nsk.sudrf.ru"
NEW = "https://barabinsky--nsk.sudrf.ru/"
EVIDENCE = "https://barabinsky--nsk.sudrf.ru/modules.php?name=info_court&rid=2"


class IndividualCourtEvidenceTests(unittest.TestCase):
    def test_legacy_http_migrated_https_needs_explicit_identity_attestation(self):
        with self.assertRaisesRegex(ImportValidationError, "migration attestation"):
            review_official_site(OLD, NEW, EVIDENCE, "sudrf-federal")
        self.assertEqual(
            review_official_site(OLD, NEW, EVIDENCE, "sudrf-federal",
                                 attest_site_migration=True),
            (NEW, EVIDENCE, True)
        )

    def test_simple_https_upgrade_on_same_official_court_host(self):
        self.assertEqual(
            review_official_site(OLD, "https://barabinsky.nsk.sudrf.ru/",
                                 "https://barabinsky.nsk.sudrf.ru/", "sudrf-federal"),
            ("https://barabinsky.nsk.sudrf.ru/",
             "https://barabinsky.nsk.sudrf.ru/", False)
        )

    def test_refuse_cross_court_evidence_even_with_attestation(self):
        with self.assertRaisesRegex(ImportValidationError, "current court host"):
            review_official_site(OLD, NEW, "https://oblsud--oms.sudrf.ru/",
                                 "sudrf-federal", attest_site_migration=True)

    def test_refuse_unofficial_and_dangerous_urls(self):
        bad = (
            "http://barabinsky--nsk.sudrf.ru/",
            "https://barabinsky--nsk.sudrf.ru.evil.test/",
            "https://bad@barabinsky--nsk.sudrf.ru/",
            "https://barabinsky--nsk.sudrf.ru:444/",
            "https://barabinsky--nsk.sudrf.ru/#section",
        )
        for site in bad:
            with self.subTest(site=site), self.assertRaises(ImportValidationError):
                review_official_site(OLD, site, EVIDENCE, "sudrf-federal",
                                     attest_site_migration=True)

    def test_moscow_federal_court_path_remains_valid(self):
        url = "https://mos-gorsud.ru/rs/lefortovskij"
        self.assertEqual(
            review_official_site(url, url, url, "mos-gorsud-court"),
            (url, url, False)
        )

    def test_no_subpage_as_public_site_for_sudrf(self):
        with self.assertRaisesRegex(ImportValidationError, "site root"):
            review_official_site(OLD, EVIDENCE, EVIDENCE,
                                 "sudrf-federal", attest_site_migration=True)

    def test_moscow_shared_domain_court_path_is_not_interchangeable(self):
        old = "https://www.mos-gorsud.ru/rs/babushkinskij"
        other = "https://www.mos-gorsud.ru/rs/tverskoj"
        with self.assertRaisesRegex(ImportValidationError, "same court path"):
            review_official_site(old, old, other, "mos-gorsud-courts")
        self.assertEqual(
            review_official_site(old, old, old, "mos-gorsud-courts"),
            (old, old, False)
        )


if __name__ == "__main__":
    unittest.main()
