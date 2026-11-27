"""Zero-network promotion rehearsal; raw parties never flow to the site."""
import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
import moscow_bulk_judge_pipeline as stage
import promote_moscow_bulk_metadata as promotion

FIRST={
 "Наименование суда":"Никулинский районный суд города Москвы",
 "Номер дела":"02-0514/2026",
 "Уникальный идентификатор дела":"77RS0018-02-2025-003155-71",
 "Судья":"Кузнецова Е.А.",
 "Категория дела":"Возмещение имущественного вреда",
 "Результат рассмотрения":"Отказано в удовлетворении",
 "Дата окончания":"28.05.2026",
 "Ссылка на карточку дела":"https://m.mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/example",
 "Стороны":[{"ФИО/Наименование":"НЕ-ПУБЛИКОВАТЬ"}]
}
class MoscowBulkMetadataReleaseTests(unittest.TestCase):
 def setUp(self):
  tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup)
  self.base=Path(tmp.name)
  inp=self.base/"input.json"
  inp.write_text(json.dumps([FIRST],ensure_ascii=False),encoding="utf-8")
  self.prepared=self.base/"stage"
  stage.run(inp,None,self.prepared)
  self.original_public=promotion.PUBLIC
  self.original_known=promotion.KNOWN
  destination=self.base/"public.json"
  destination.write_text(json.dumps({"source":"https://data.mos-gorsud.ru/opendata","records":[]},ensure_ascii=False),encoding="utf-8")
  known=self.base/"known.json"
  known.write_text(json.dumps({"records":[]},ensure_ascii=False),encoding="utf-8")
  promotion.PUBLIC=destination
  promotion.KNOWN=known
  self.addCleanup(lambda:setattr(promotion,"PUBLIC",self.original_public))
  self.addCleanup(lambda:setattr(promotion,"KNOWN",self.original_known))
 def test_preflight_does_not_modify_public_site(self):
  before=promotion.PUBLIC.read_bytes()
  report=promotion.promote(self.prepared)
  self.assertEqual(report["mode"],"dry_run")
  self.assertEqual(report["accepted"],1)
  self.assertEqual(promotion.PUBLIC.read_bytes(),before)
 def test_acknowledged_apply_is_bounded_private_and_idempotent(self):
  with self.assertRaises(ValueError):
   promotion.promote(self.prepared,apply=True)
  result=promotion.promote(self.prepared,apply=True,ack=True)
  self.assertEqual(result["accepted"],1)
  rows=json.loads(promotion.PUBLIC.read_text())["records"]
  self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]["evidenceLevel"],"official_dataset_record")
  self.assertFalse(rows[0]["judicialActTextVerified"])
  self.assertNotIn("Стороны",rows[0])
  self.assertNotIn("НЕ-ПУБЛИКОВАТЬ",promotion.PUBLIC.read_text())
  self.assertEqual(promotion.promote(self.prepared)["accepted"],0)
 def test_crosschecked_mode_does_not_auto_trust_one_register(self):
  result=promotion.promote(self.prepared,mode="crosschecked")
  self.assertEqual(result["accepted"],0)
  self.assertEqual(result["counts"]["single_source_skipped"],1)
 def test_invalid_ui_data_and_different_uins_not_merged(self):
  x=next(json.loads(s) for s in (self.prepared/"candidates.ndjson").read_text().splitlines())
  for mutation in (
   {"uin":"invalid"},{"sourceUrl":"https://evil.example/rs/nikulinskij/services/cases/civil"},
   {"judicialActTextVerified":True},{"status":"pending","outcome":"Удовлетворено"}
  ):
   with self.subTest(mutation=mutation),self.assertRaises(ValueError):
    promotion.check_row({**x,**mutation},"official")
  promotion.PUBLIC.write_text(json.dumps({"records":[{
   "courtSlug":x["courtSlug"],"number":x["number"],"uin":"77RS0000-02-2026-000001-10",
   "judgeName":x["judgeName"]}]},ensure_ascii=False),encoding="utf-8")
  with self.assertRaises(ValueError):promotion.promote(self.prepared)
 def test_per_court_limit_enforced(self):
  self.assertEqual(promotion.promote(self.prepared,max_per_court=1)["accepted"],1)
  with self.assertRaises(ValueError):promotion.promote(self.prepared,max_per_court=0)
if __name__=="__main__":unittest.main()
