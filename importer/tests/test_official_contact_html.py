import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from contacts import ImportValidationError
from official_contact_html import extract,compare,official_hours_url,MAX_HTML_BYTES

BASE="""<html><body><h1>Test court</h1><main><h2>Контакты суда</h2>
<p>Приёмная суда +7 (495) 678-05-22</p>
<p>Почта: info@example.ru</p><script>fake +7 (999) 999-99-99</script>
<p>Последнее обновление выполнено 08.07.2026 12:02:18</p>
</main></body></html>""".encode("utf-8")
NEW="""<html><body><h1>Test court</h1><main><h2>Контакты суда</h2>
<p>Приёмная суда 8 (495) 678-05-22</p>
<p>Телефон архива +7 (499) 530-08-08</p>
<p>Почта: new@example.ru</p>
<p>Последнее обновление выполнено 09.07.2026 12:02:18</p>
</main></body></html>""".encode("utf-8")
URL="https://mos-gorsud.ru/rs/lefortovskij/help/hours"


class OfficialContactHtmlTests(unittest.TestCase):
    def test_normalized_phone_and_hidden_scripts(self):
        rows=extract(BASE)["observations"]
        self.assertEqual({(x["kind"],x["key"]) for x in rows},
            {("phone","+74956780522"),("email","info@example.ru")})
        self.assertIn("Приёмная суда",next(x["context"] for x in rows if x["kind"]=="phone"))
        self.assertEqual(extract(BASE)["page_last_updated"],"08.07.2026 12:02:18")
    def test_only_changes_become_review_signals(self):
        before,after=extract(BASE),extract(NEW)
        result=compare(before,after)
        self.assertEqual(result["signal_count"],3)
        self.assertEqual({(x["event"],x["value"]) for x in result["signals"]},{
            ("newly_observed","+74995300808"),
            ("newly_observed","new@example.ru"),
            ("not_observed_in_new_snapshot","info@example.ru"),
        })
        self.assertFalse(result["removals_verified"])
        self.assertEqual(result["auto_published"],0)
    def test_no_signal_when_phone_format_changes(self):
        variant=BASE.replace(b"+7 (495) 678-05-22",b"8 (495) 678-05-22")
        self.assertEqual(compare(extract(BASE),extract(variant))["signals"],[])
    def test_reject_absent_court_and_invalid_raw_html(self):
        for value in (b"",b"<html><body>any page +7 (495) 678-05-22</body></html>",
                      b"x"*(MAX_HTML_BYTES+1), b"\xff\xfe"):
            with self.subTest(value=value[:20]),self.assertRaises(ImportValidationError):
                extract(value)
    def test_official_url_gated_to_hours_page(self):
        self.assertEqual(official_hours_url(URL),URL)
        for url in ("https://mos-gorsud.ru.evil.invalid/rs/lefortovskij/help/hours",
                    "http://mos-gorsud.ru/rs/lefortovskij/help/hours",
                    "https://mos-gorsud.ru/rs/lefortovskij/structure/judges",
                    "https://mos-gorsud.ru/rs/lefortovskij/help/hours?x=1"):
            with self.subTest(url=url),self.assertRaises(ImportValidationError):
                official_hours_url(url)
    def test_parse_not_a_mutation_and_works_with_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            old=Path(tmp)/"old.html";new=Path(tmp)/"new.html"
            old.write_bytes(BASE);new.write_bytes(NEW)
            self.assertEqual(compare(extract(old.read_bytes()),extract(new.read_bytes()))["signal_count"],3)


if __name__=="__main__":
    unittest.main()
