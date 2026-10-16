"""Offline release contract for local-first court pages, today's schedule and maps."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[2]/"apps/web/app"
class LocalCourtContentTests(unittest.TestCase):
    def read(self,path):
        return (ROOT/path).read_text(encoding="utf-8")
    def test_local_guides_on_all_pilot_courts(self):
        page=self.read("_components/pilot-court-public.tsx")
        for component in ["CourtPracticalGuide","YandexCourtMap","CourtTodayHearings"]:
            self.assertIn("<"+component, page)
        self.assertIn('Suspense',page)
        self.assertIn('id="pilot-contacts"',page)
        self.assertIn('id="pilot-competence"',page)
        self.assertIn('id="pilot-sources"',page)
    def test_daily_hearing_date_is_mandatory(self):
        parser=self.read("lib/official-hearings.ts")
        self.assertIn("'Asia/Omsk'",parser)
        self.assertIn("'Asia/Novosibirsk'",parser)
        self.assertIn("url.searchParams.set('H_date',date.ru)",parser)
        self.assertIn("dateInHeading[1]!==expectedDate",parser)
        self.assertIn("empty?.[1]===expectedDate",parser)
        self.assertIn("return unavailable(",parser)
        self.assertIn("next:{revalidate:3600}",parser)
        self.assertIn("AbortSignal.timeout(6500)",parser)
        self.assertNotIn("partyName",parser)
    def test_map_is_embedded_but_unsourced_geometry_not_asserted(self):
        s=self.read("_components/yandex-court-map.tsx")
        self.assertIn("https://yandex.ru/map-widget/v1/?",s)
        self.assertIn("allowFullScreen",s)
        self.assertIn("loading=\"lazy\"",s)
        self.assertIn("точная метка входа ещё не подтверждена",s)
        self.assertNotIn("apiKey",s)
    def test_legislation_detailed_not_just_outbound_cards(self):
        x=self.read("_components/court-practical-guide.tsx")
        for text in ["29.07.2026", "333.19", "Апелляционная жалоба",
                    "Электронная подпись", "Государственная пошлина",
                    "Сохраните подтверждение"]:
            self.assertIn(text,x)
        dossier=self.read("_components/research-dossier.tsx")
        self.assertIn("court-source-details",dossier)
        self.assertNotIn("Документы, подсудность и судебные дела</h2>",dossier)

if __name__=="__main__":
    unittest.main()
