"""New official appointment records must not be mistaken for complete rosters."""
import json,unittest
from pathlib import Path
from urllib.parse import urlsplit

APP=Path(__file__).resolve().parents[2]/"apps/web/app"
def records(p):return json.loads((APP/"data"/p).read_text(encoding="utf-8"))["records"]
APPT=records("moscow-confirmed-appointment-additions.json")
EVENTS=records("moscow-judicial-appointment-events.json")
COURTS=records("moscow-district-individual-dossiers.json")
ROSTERS=records("moscow-district-judges-samples.json")+records("moscow-legacy-judge-rosters.json")+records("moscow-additional-judge-rosters.json")
PROFILE=(APP/"courts/moscow/judges/[courtSlug]/[judgeSlug]/page.tsx").read_text(encoding="utf-8")
DIRECTORY=(APP/"lib/moscow-judge-directory.ts").read_text(encoding="utf-8")

class AppointmentUpdates2026Tests(unittest.TestCase):
 def test_29_official_standalone_appointments_have_decree_sources(self):
  self.assertEqual(len(APPT),29)
  self.assertEqual(len({(r["courtSlug"],r["name"]) for r in APPT}),29)
  missing={"zamoskvoretskiy","kuzminskiy","meshchanskiy","khamovnicheskiy","shcherbinskiy"}
  self.assertTrue(missing<={r["courtSlug"] for r in APPT})
  for r in APPT:
   self.assertEqual(r["kind"],"official_appointment_not_current_roster")
   self.assertRegex(r["appointedOn"],r"^20\d{2}-\d{2}-\d{2}$")
   self.assertTrue(r["decreeNumber"].isdigit())
   self.assertIn(urlsplit(r["sourceUrl"]).hostname,{"mos-gorsud.ru","www.mos-gorsud.ru"})
 def test_four_recent_chairs_and_five_important_new_court_appointments(self):
  self.assertEqual(len(EVENTS),9)
  self.assertEqual(sum(e["eventType"]=="appointed_chair" for e in EVENTS),4)
  self.assertEqual(sum(e["eventType"]=="appointed_to_moscow_city_court" for e in EVENTS),5)
  by_slug={r["slug"]:r for r in COURTS}
  for e in EVENTS:
   self.assertRegex(e["appointmentDate"],r"^2026-\d{2}-\d{2}$")
   self.assertIn("/mgs/news/",e["sourceUrl"])
   if e["eventType"]=="appointed_chair":
    self.assertEqual(by_slug[e["courtSlug"]]["chairPublished"],e["name"])
    self.assertEqual(by_slug[e["courtSlug"]]["chairStatus"],"as_published")
  historic=[r for r in APPT if r["observedOn"]=="2026-11-10"]
  self.assertEqual(len(historic),6)
  self.assertEqual({r["courtSlug"] for r in historic},{"tverskoy","tushinskiy","shcherbinskiy"})
  city=[e for e in EVENTS if e["name"]=="Слизовский Алексей Александрович"]
  self.assertEqual(len(city),1)
  self.assertEqual(city[0]["courtSlug"],"shcherbinskiy")
  self.assertEqual(city[0]["eventType"],"appointed_to_moscow_city_court")
  self.assertEqual(city[0]["decreeNumber"],"723")
  self.assertIn("moscowJudgeAppointmentEvents(courtSlug,judge.name)",PROFILE)
  self.assertIn("appointed_to_moscow_city_court",PROFILE)
  self.assertIn("appointmentAdds.records",DIRECTORY)
  self.assertIn("MOSCOW_RECENT_CHAIR_APPOINTMENTS",DIRECTORY)
 def test_incomplete_rosters_not_silently_marked_complete(self):
  represented={r["slug"] for r in ROSTERS}
  for court in ("zamoskvoretskiy","kuzminskiy","meshchanskiy","khamovnicheskiy","shcherbinskiy"):
   self.assertNotIn(court,represented)
if __name__=="__main__":unittest.main()
