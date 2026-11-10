"""Source-bound court card coverage for all 35 Moscow district courts."""
import json
import re
import unittest
from pathlib import Path

APP=Path(__file__).resolve().parents[2]/"apps/web/app"
DATA=APP/"data"


class MoscowThirtyFiveFullCards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry=json.loads((DATA/"moscow-official-minimum-registry.json").read_text(encoding="utf-8"))
        cls.individual=json.loads((DATA/"moscow-district-individual-dossiers.json").read_text(encoding="utf-8"))["records"]
        cls.rich=json.loads((APP/"lib/moscow-court-dossiers.json").read_text(encoding="utf-8"))
        cls.leaders=json.loads((DATA/"moscow-district-published-leadership.json").read_text(encoding="utf-8"))["records"]
        cls.practical=json.loads((DATA/"moscow-district-practical-facts.json").read_text(encoding="utf-8"))["records"]

    def test_every_court_has_unique_official_source_and_public_dossier(self):
        districts={c["slug"] for c in self.registry["records"] if c["kind"]=="general-district"}
        self.assertEqual(len(districts),35)
        source_slugs=[r["slug"] for r in self.practical]
        self.assertEqual(set(source_slugs),districts)
        self.assertEqual(len(source_slugs),len(set(source_slugs)))
        self.assertEqual({r["slug"] for r in self.individual}|{r["slug"] for r in self.leaders},districts)
        self.assertEqual({r["slug"] for r in self.individual}&{r["slug"] for r in self.leaders},set())
        self.assertEqual(len(self.individual),23)
        self.assertEqual(len(self.leaders),12)

    def test_published_leadership_is_not_falsely_presented_as_current_appointment(self):
        all_roots={r["official_url"] for r in self.rich}
        self.assertEqual({r["sourceUrl"] for r in self.leaders},all_roots)
        for row in self.leaders:
            with self.subTest(court=row["slug"]):
                self.assertEqual(row["observedOn"],"2026-11-10")
                self.assertFalse(row["currentAppointmentVerified"])
                self.assertIn(row["positionAsPublished"],{"chair","acting","status_disputed"})
                self.assertTrue(row["name"] and len(row["name"].split())>=3)
                if row["expeditionPhone"] is not None:
                    self.assertRegex(row["expeditionPhone"],r"^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$")
                self.assertTrue(row["sourceUrl"].startswith("https://mos-gorsud.ru/rs/"))
        self.assertTrue(any(x["positionAsPublished"]=="status_disputed" for x in self.leaders))

    def test_guide_and_case_lookup_are_available_for_all_thirty_five(self):
        topic=(APP/"courts/moscow/registry/[slug]/info/[topic]/page.tsx").read_text(encoding="utf-8")
        rich=(APP/"courts/moscow/[slug]/page.tsx").read_text(encoding="utf-8")
        guide=(APP/"_components/moscow-district-registry-guide.tsx").read_text(encoding="utf-8")
        finder=(APP/"_components/moscow-court-quick-finder.tsx").read_text(encoding="utf-8")
        hub=(APP/"courts/moscow/page.tsx").read_text(encoding="utf-8")
        self.assertIn("MOSCOW_OFFICIAL_MINIMUM_COURTS.filter",topic)
        self.assertIn("moscowDistrictOfficialPagesBySlug(slug)",topic)
        self.assertIn("MoscowOfficialCourtHref(court)",topic)
        self.assertIn("MoscowDistrictTopicNavigation",rich)
        self.assertIn("MoscowDistrictPublishedLeader",rich)
        self.assertIn("MoscowDistrictRegistryGuide",guide)
        self.assertIn("MoscowCourtQuickFinder",hub)
        self.assertIn("href={c.href}",finder)
        self.assertIn("type=\"search\"",finder)
        self.assertIn("aria-live=\"polite\"",finder)
        self.assertIn("href={'/courts/moscow/registry/'+c.slug+'/info/filing'}",finder)
        self.assertIn("href={'/courts/moscow/registry/'+c.slug+'/info/cases'}",finder)
        self.assertIn("href={'/courts/moscow/registry/'+c.slug+'/info/appeal'}",finder)
        self.assertIn("robots:{index:false,follow:true}",topic)

    def test_user_pages_do_not_claim_there_are_only_twelve_courts(self):
        rich=(APP/"courts/moscow/[slug]/page.tsx").read_text(encoding="utf-8")
        self.assertNotIn("Все 12 московских карточек",rich)
        self.assertIn("Все 35 районных судов Москвы",rich)


if __name__=="__main__":unittest.main()
