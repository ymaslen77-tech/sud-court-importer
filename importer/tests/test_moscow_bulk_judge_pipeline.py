"""End-to-end OFFLINE rehearsal of official bulk preimport: no network or publication."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import moscow_bulk_judge_pipeline as p

FIRST={
 "Наименование суда":"Никулинский районный суд города Москвы",
 "Номер дела, материала, жалобы или производства":"02-0514/2026",
 "Уникальный идентификатор дела":"77RS0018-02-2025-003155-71",
 "Судья":"Кузнецова Е.А.",
 "Категория дела":"Возмещение имущественного вреда",
 "Результат рассмотрения":"Отказано в удовлетворении",
 "Дата окончания":"28.05.2026",
 "Ссылка на карточку дела":"https://m.mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/testcase",
 "Стороны":[{"ФИО/Наименование":"ПЕРСОНАЛЬНЫЕ-ДАННЫЕ-НЕ-КОПИРОВАТЬ"}],
 "Судебные акты":[{"Ссылка на акт":"https://m.mos-gorsud.ru/rs/nikulinskij/doc/sample"}]
}
APPEAL={
 "Наименование суда":"Московский городской суд",
 "Уникальный идентификатор дела":FIRST["Уникальный идентификатор дела"],
 "Номер дела":"Ж-65034/2026",
 "Дата поступления дела в апелляционную инстанцию":"30.09.2026",
 "Ссылка на карточку дела":"https://m.mos-gorsud.ru/mgs/services/cases/appeal-civil/details/testappeal",
 "Дело/документ в нижестоящей инстанции":[
  {"Номер дела в суде нижестоящей инстанции":"02-0514/2026","Судья первой инстанции":"Кузнецова Е.А."}
 ],
 "Стороны":[{"ФИО/Наименование":"НЕ-КОПИРОВАТЬ-УЧАСТНИКОВ"}]
}
class MoscowBulkJudgePipelineTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.courts,cls.official,cls.judges=p.court_directory()
 def tempfiles(self,first,appeal=None):
  tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup)
  directory=Path(tmp.name)
  source=directory/"first.json";source.write_text(json.dumps(first,ensure_ascii=False),encoding="utf-8")
  other=directory/"appeal.json"
  if appeal is not None:other.write_text(json.dumps(appeal,ensure_ascii=False),encoding="utf-8")
  return directory,source,other if appeal is not None else None
 def test_covers_all_thirty_five_courts_and_unique_judicial_name(self):
  self.assertEqual(len(set(self.courts.values())),35)
  self.assertEqual(len(self.official),35)
  a,reason=p.first_row(FIRST,self.courts,self.official,self.judges)
  self.assertIsNone(reason)
  self.assertEqual(a["courtSlug"],"nikulinskiy")
  self.assertEqual(a["judgeName"],"Кузнецова Елена Алексеевна")
  self.assertEqual(a["outcome"],"Отказано в удовлетворении")
  self.assertFalse(a["judicialActTextVerified"])
  self.assertNotIn("Стороны",a)
  self.assertEqual(a["verificationLevel"],"single_official_record_unchecked_live")
 def test_workflow_matches_official_first_instance_and_appeal(self):
  root,first,appeal=self.tempfiles([FIRST],[APPEAL])
  report=p.run(first,appeal,root/"out")
  self.assertEqual(report["counts"]["staged"],1)
  self.assertEqual(report["counts"]["appeal_linked"],1)
  staged=[json.loads(x) for x in (root/"out/candidates.ndjson").read_text().splitlines()]
  self.assertEqual(len(staged),1)
  self.assertEqual(staged[0]["verificationLevel"],"official_registers_concordant")
  self.assertEqual(staged[0]["uin"],FIRST["Уникальный идентификатор дела"])
  linked=[json.loads(x) for x in (root/"out/appeal_links.ndjson").read_text().splitlines()]
  self.assertEqual(linked[0]["appealResult"],None)
  self.assertFalse(report["autoPublished"])
  for filename in ("candidates.ndjson","appeal_links.ndjson","report.json","quarantine.ndjson"):
   self.assertNotIn("НЕ-КОПИРОВАТЬ",(root/"out"/filename).read_text())
   self.assertNotIn("ПЕРСОНАЛЬНЫЕ-ДАННЫЕ",(root/"out"/filename).read_text())
 def test_conflict_quarantined_with_no_public_export(self):
  different=dict(FIRST,**{"Результат рассмотрения":"Удовлетворено"})
  root,first,_=self.tempfiles([FIRST,different])
  report=p.run(first,None,root/"out")
  self.assertEqual(report["counts"]["contradictory_duplicates"],1)
  self.assertEqual(report["counts"]["staged"],0)
  self.assertIn("contradictory_duplicate",(root/"out/quarantine.ndjson").read_text())
 def test_wrong_judge_court_and_nonofficial_link_rejected(self):
  for replacement in [
   {"Судья":"Кузнецова Несуществующая А."},
   {"Наименование суда":"Неизвестный районный суд"},
   {"Ссылка на карточку дела":"https://evil.example/details"},
   {"Уникальный идентификатор дела":"missing"},
   {"Категория дела":"Усыновление несовершеннолетнего"},
  ]:
   row=dict(FIRST,**replacement)
   value,error=p.first_row(row,self.courts,self.official,self.judges)
   with self.subTest(replacement=replacement):
    self.assertIsNone(value)
    self.assertTrue(error)
 def test_pending_metadata_never_implies_decision(self):
  row=dict(FIRST)
  row.pop("Результат рассмотрения")
  val,error=p.first_row(row,self.courts,self.official,self.judges)
  self.assertIsNone(error)
  self.assertEqual(val["status"],"pending")
  self.assertIsNone(val["decisionDate"])
  self.assertEqual(val["outcome"],"Не установлено")
 def test_bad_appeal_identity_not_joined(self):
  other=dict(APPEAL,**{"Уникальный идентификатор дела":"77RS0018-02-2025-000001-12"})
  root,first,appeal=self.tempfiles([FIRST],[other])
  report=p.run(first,appeal,root/"out")
  self.assertEqual(report["counts"]["staged"],1)
  self.assertEqual(report["counts"]["appeal_unmatched_or_ambiguous"],1)
  self.assertEqual(report["counts"].get("appeal_linked",0),0)
 def test_retry_requires_fresh_directory(self):
  root,first,_=self.tempfiles([FIRST])
  p.run(first,None,root/"out")
  with self.assertRaises(ValueError):
   p.run(first,None,root/"out")
if __name__=="__main__":unittest.main()
