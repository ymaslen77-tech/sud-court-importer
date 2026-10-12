import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const site=process.env.PUBLIC_SITE_URL??'http://localhost:4173';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: new URL('/sitemap.xml',site).toString()
  };
}
