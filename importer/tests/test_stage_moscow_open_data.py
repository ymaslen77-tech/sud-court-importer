import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from stage_moscow_open_data import stage,topic,url_ok,court_slug

class MoscowOpenDataStageTests(unittest.TestCase):
    def test_official_names_and_thematic_mapping(self):
        self.assertEqual(court_slug("Лефортовский районный суд города Москвы"),"lefortovskij")
        self.assertIsNone(court_slug("Случайный районный суд"))
        self.assertEqual(topic("Восстановление на работе в связи с увольнением"),"labor")
        self.assertEqual(topic("Взыскание алиментов"),"family")
        self.assertFalse(url_ok("https://mos-gorsud.ru.evil.example/rs/lefortovskij/services/cases/civil","lefortovskij"))
        self.assertTrue(url_ok("https://m.mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/abc","lefortovskij"))

    def test_stage_only_verified_source_urls_no_parties_or_autopublication(self):
        rows=[
          {"Наименование суда":"Лефортовский районный суд города Москвы",
           "Номер дела":"02-1234/2026",
           "Категория дела":"Восстановление на работе после увольнения",
           "Результат рассмотрения":"Иск удовлетворён",
           "Дата окончания":"11.10.2026",
           "Стороны":[{"ФИО/Наименование":"Частное лицо"}],
           "Ссылка на карточку дела":"https://m.mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/example"},
          {"Наименование суда":"Лефортовский районный суд города Москвы",
           "Номер дела":"02-1235/2026",
           "Категория дела":"Восстановление на работе",
           "Результат рассмотрения":"Отказано",
           "Ссылка на карточку дела":"https://malicious.example/rs/lefortovskij/services/cases/civil/details/example"}
        ]
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"public.json";p.write_text(json.dumps(rows,ensure_ascii=False),encoding="utf-8")
            out=Path(d)/"stage.json"
            report=stage(p,out)
            self.assertEqual(report["counts"]["staged"],1)
            self.assertEqual(report["counts"]["invalid_official_docket"],1)
            self.assertFalse(report["auto_published"])
            self.assertEqual(report["records"][0]["topic_id"],"labor")
            self.assertEqual(report["records"][0]["editorial_status"],"research_only")
            self.assertEqual(report["records"][0]["full_document_verified"],False)
            text=out.read_text()
            self.assertNotIn("Частное лицо",text)
            self.assertIn("02-1234/2026",text)
            with self.assertRaises(ValueError):stage(p,out)

    def test_stream_ndjson(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"s.ndjson";p.write_text(json.dumps({"courtName":"Никулинский районный суд города Москвы",
              "caseNumber":"02-555/2026","category":"Взыскание задолженности по кредитному договору",
              "caseUrl":"https://mos-gorsud.ru/rs/nikulinskij/services/cases/civil/details/test"},ensure_ascii=False)+"\n")
            report=stage(p,Path(d)/"out.json")
            self.assertEqual(report["counts"]["staged"],1)
            self.assertEqual(report["records"][0]["topic_id"],"credit")
if __name__=="__main__":unittest.main()
