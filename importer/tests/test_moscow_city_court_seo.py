"""Search indexing guardrails for the Moscow City Court nine-page topic cluster."""
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/'apps/web/app'
SEO=(APP/'lib/moscow-city-seo.ts').read_text(encoding='utf-8')
SITEMAP=(APP/'sitemap.ts').read_text(encoding='utf-8')
TOPIC=(APP/'courts/moscow/registry/moscow-city-court/info/[topic]/page.tsx').read_text(encoding='utf-8')
REGISTRY=(APP/'courts/moscow/registry/[slug]/page.tsx').read_text(encoding='utf-8')
DOSSIER=(APP/'_components/moscow-city-court-dossier.tsx').read_text(encoding='utf-8')
MIDDLEWARE=(ROOT/'apps/web/middleware.ts').read_text(encoding='utf-8')

class MoscowCitySeoTests(unittest.TestCase):
 def test_indexing_requires_explicit_release_and_public_https_domain(self):
  self.assertIn("SEO_MOSCOW_CITY_COURT_INDEXABLE==='true'",SEO)
  self.assertIn("url.protocol!=='https:'",SEO)
  self.assertIn("if(!raw)return null",SEO)
  self.assertIn("sslip",SEO)
  self.assertIn("preview",SEO)
  self.assertIn("index:false,follow:true",SEO)
  self.assertIn("index:true,follow:true",SEO)

 def test_sitemap_only_listed_after_editorial_seo_release(self):
  self.assertIn("if(mgsSeoIndexable())",SITEMAP)
  self.assertIn("MGS_SEO_PATHS",SITEMAP)
  self.assertIn("mgsSeoAbsoluteUrl(path)",SITEMAP)
  self.assertIn("MGS_SEO_PATHS=[MGS_BASE,...MGS_GUIDE_TOPICS.map",SEO)

 def test_titles_canonicals_open_graph_structured_data_and_internal_links(self):
  self.assertIn("Московский городской суд — подсудность, дела, адрес и контакты",REGISTRY)
  self.assertIn("alternates:{canonical:url}",REGISTRY)
  self.assertIn("openGraph:{type:'article'",REGISTRY)
  self.assertIn("robots:mgsSeoRobots()",REGISTRY)
  self.assertIn("robots:mgsSeoRobots()",TOPIC)
  self.assertIn("mgsSeoStructuredData",DOSSIER)
  self.assertIn("mgsSeoStructuredData",TOPIC)
  self.assertIn("'@type':'WebPage'",SEO)
  self.assertIn("'@type':'BreadcrumbList'",SEO)
  self.assertIn("mgsGuideHref(topic.slug)",DOSSIER)
  self.assertIn("mgsGuideHref(s)",TOPIC)
  self.assertIn("target=\"_blank\"",TOPIC)

 def test_preview_hosts_have_noindex_header_even_when_public_url_is_set(self):
  self.assertIn("X-Robots-Tag",MIDDLEWARE)
  self.assertIn("noindex, nofollow, noarchive",MIDDLEWARE)
  self.assertIn("host.endsWith('.sslip.io')",MIDDLEWARE)
  self.assertIn("NextResponse.next()",MIDDLEWARE)

if __name__=='__main__':unittest.main()
