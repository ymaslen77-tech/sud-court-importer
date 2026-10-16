"""Read-only PDF annex inventory smoke. All PDFs here are synthetic."""
from pathlib import Path
import json
import tempfile
import unittest
import sys

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"importer"))
from jurisdiction_pdf_inventory import pdf_inventory,PdfIntakeError


class OfficialPdfInventoryTests(unittest.TestCase):
    def test_extracts_candidate_annexes_but_never_approves(self):
        import fitz
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/"synthetic.pdf"
            d=fitz.open()
            for text in (
                "Закон Новосибирской области\nN 149-ОЗ 01.10.2026\nВнесены изменения в приложения 1 - 138\n"+
                 ("Исследовательский текст. "*10),
                "Приложение 1\nСистема координат: EPSG:4326\nТаблица координат границ\n"+
                 ("Только синтетическая страница. "*5),
                "Приложение 2\nКоординатное описание границ\n"+
                 ("Тестовая исходная страница. "*5),
            ):
                page=d.new_page()
                page.insert_font(fontname='dejavu',fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
                page.insert_text((35,75),text,fontname='dejavu',fontsize=8)
            d.save(p)
            d.close()
            x=pdf_inventory(p,expected=3)
            self.assertEqual(x["page_count"],3)
            self.assertEqual(x["expected_annexes"],3)
            self.assertEqual(x["accepted_geometries"],0)
            self.assertEqual(x["approved_for_jurisdiction"],0)
            self.assertEqual(x["missing_annex_headings"],[3])
            self.assertTrue(x["manual_page_review_required"])
            self.assertEqual(len(x["document_sha256"]),64)
            self.assertIn("1",x["possible_annex_start_pages"])

    def test_refuses_invalid_or_wrong_sized_pdf(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/"garbage.pdf"
            p.write_bytes(b"Not a PDF")
            with self.assertRaises(PdfIntakeError): pdf_inventory(p)
            with self.assertRaises(PdfIntakeError): pdf_inventory(p,expected=0)
            with self.assertRaises(PdfIntakeError): pdf_inventory(Path(td)/"missing.pdf")

if __name__=="__main__":
    unittest.main()
