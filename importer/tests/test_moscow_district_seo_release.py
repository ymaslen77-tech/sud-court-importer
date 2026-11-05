"""Search release of 35 canonical district hubs is safe and explicitly controlled."""
import json,unittest,re
from pathlib import Path
APP=Path(__file__).resolve().parents[2]/'apps/web/app'
MINIMUM=json.loads((APP/'data/moscow-official-minimum-registry.json').read_text(encoding='utf-8'))['records']
SEO=(APP/'lib/moscow-city-seo.ts').read_text(encoding='utf-8')
SITEMAP=(APP/'sitemap.ts').read_text(encoding='utf-8')
HUB=(APP/'courts/moscow/page.tsx').read_text(encoding='utf-8')
RICH=(APP/'courts/moscow/[slug]/page.tsx').read_text(encoding='utf-8')
REGISTRY=(APP/'courts/moscow/registry/[slug]/page.tsx').read_text(encoding='utf-8')
TOPIC=(APP/'courts/moscow/registry/[slug]/info/[topic]/page.tsx').read_text(encoding='utf-8')
MIDDLEWARE=(APP.parent/'middleware.ts').read_text(encoding='utf-8')
class MoscowDistrictSeoReleaseTests(unittest.TestCase):
 def test_canonical_35_and_preview_guardrails(self):
  self.assertEqual(sum(x['kind']=='general-district' for x in MINIMUM),35)
  self.assertIn("SEO_MOSCOW_DISTRICTS_INDEXABLE==='true'",SEO)
  self.assertIn("canonicalPublicSite()!==null",SEO)
  self.assertIn("moscowDistrictSeoRobots()",HUB)
  self.assertIn("moscowDistrictSeoRobots()",RICH)
  self.assertIn("robots:moscowDistrictSeoRobots()",REGISTRY)
  self.assertIn("moscowDistrictSeoIndexable()",SITEMAP)
  self.assertIn("MoscowOfficialCourtHref(c)",SITEMAP)
  self.assertIn("path==='/courts/moscow'",SITEMAP)
  self.assertIn("permanentRedirect(detailed)",REGISTRY)
  self.assertIn("X-Robots-Tag",MIDDLEWARE)
 def test_topic_routes_stay_noindex_until_individual_review(self):
  self.assertIn("robots:{index:false,follow:true}",TOPIC)
  self.assertNotIn("moscowDistrictSeoRobots()",TOPIC)
  self.assertIn("MOSCOW_DISTRICT_INDIVIDUALS.flatMap",TOPIC)
  self.assertIn("MOSCOW_DISTRICT_TOPICS.map",TOPIC)
if __name__=='__main__':unittest.main()
