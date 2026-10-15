import io
import sys
import unittest
from pathlib import Path
from PIL import Image

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from photo import valid_https,sanitized_image
from contacts import ImportValidationError

class PhotoTests(unittest.TestCase):
    def test_source_domains(self):
        self.assertTrue(valid_https("https://commons.wikimedia.org/wiki/File:Test.webp",
                                    ("commons.wikimedia.org",)))
        self.assertFalse(valid_https("https://commons.wikimedia.org.evil.com/File:fake.jpg",
                                    ("commons.wikimedia.org",)))
        self.assertFalse(valid_https("http://commons.wikimedia.org/wiki/File:Test.jpg",
                                     ("commons.wikimedia.org",)))

    def test_removes_exif_and_converts_to_webp(self):
        source=Image.new("RGB",(640,480),(220,220,220))
        exif=Image.Exif()
        exif[270]="Sensitive metadata must be removed"
        raw=io.BytesIO()
        source.save(raw,format="JPEG",exif=exif)
        cleaned=sanitized_image(raw.getvalue())
        with Image.open(io.BytesIO(cleaned)) as image:
            self.assertEqual(image.format,"WEBP")
            self.assertEqual(image.size,(640,480))
            self.assertEqual(len(image.getexif()),0)

    def test_reject_corrupt_and_tiny_images(self):
        with self.assertRaises(ImportValidationError):
            sanitized_image(b"not an image")
        tiny=Image.new("RGB",(30,30),(0,0,0))
        buf=io.BytesIO()
        tiny.save(buf,format="PNG")
        with self.assertRaises(ImportValidationError):
            sanitized_image(buf.getvalue())

if __name__=="__main__":
    unittest.main()
