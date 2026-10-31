import type {MetadataRoute} from 'next';
import {pilotPublicCourts} from './lib/pilot-public';
import {mgsSeoIndexable,MGS_SEO_PATHS,mgsSeoAbsoluteUrl} from './lib/moscow-city-seo';
export const dynamic='force-dynamic';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const site=process.env.PUBLIC_SITE_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL
       : process.env.VERCEL_URL ? 'https://'+process.env.VERCEL_URL
       : 'http://localhost:4173');
  const pages=['/','/courts','/courts/types','/sources'];
  const result:MetadataRoute.Sitemap=pages.map(path=>({
    url:new URL(path,site).toString(),changeFrequency:'monthly',priority:path==='/'?1:.6
  }));
  // Pilot research cards are publicly sourced with explicit freshness notices,
  // not verified court DB entities. Only the curated first ten are indexable.
  const listed=new Set<string>(result.map(entry=>entry.url));
  // Publish only the editorially released MGS dossier on a canonical HTTPS production host.
  if(mgsSeoIndexable()){
    for(const path of MGS_SEO_PATHS){
      const url=mgsSeoAbsoluteUrl(path);
      if(url&&!listed.has(url)){
        result.push({url,changeFrequency:'monthly',priority:path===MGS_SEO_PATHS[0]?.8:.6});
        listed.add(url);
      }
    }
  }
  for(const pilot of pilotPublicCourts()){
    const path='/courts/region-'+pilot.region_code+'/sud-'+pilot.external_code.toLowerCase();
    const url=new URL(path,site).toString();
    if(!listed.has(url)){
      result.push({url,changeFrequency:'monthly',priority:.55});
      listed.add(url);
    }
  }
  const pilotRegions=new Set(pilotPublicCourts().map(court=>'region-'+court.region_code));
  for(const region of pilotRegions){
    const url=new URL('/courts/'+region,site).toString();
    if(!listed.has(url)){result.push({url,changeFrequency:'monthly',priority:.55});listed.add(url);}
  }
  try{
    const base=process.env.API_URL?.replace(/\/$/,'');
    if(!base)return result;
    const response=await fetch(base+'/api/v1/courts/sitemap',{next:{revalidate:3600}});
    if(!response.ok)throw new Error('unavailable');
    const courts=await response.json() as {
      region_slug:string;slug:string;updated_at:string
    }[];
    for(const court of courts){
      if(!/^[a-z0-9-]{1,100}$/.test(court.region_slug)
        || !/^[a-z0-9-]{1,100}$/.test(court.slug))continue;
      const date=new Date(court.updated_at);
      const url=new URL('/courts/'+court.region_slug+'/'+court.slug,site).toString();
      if(listed.has(url))continue;
      listed.add(url);
      result.push({
        url,
        lastModified:Number.isFinite(date.getTime())?date:undefined,
        changeFrequency:'weekly',priority:.75
      });
    }
    // Region landing pages are included only after the API reports published courts.
    // No phantom region pages enter search indexing.
    try{
      const regionsResponse=await fetch(base+'/api/v1/regions',{next:{revalidate:3600}});
      if(regionsResponse.ok){
        const regions=await regionsResponse.json() as {slug:string;court_count:number}[];
        for(const region of regions){
          if(!/^[a-z0-9-]{1,100}$/.test(region.slug) || region.court_count<=0)continue;
          const url=new URL('/courts/'+region.slug,site).toString();
          if(listed.has(url))continue;
          listed.add(url);
          result.push({
            url,
            changeFrequency:'weekly',priority:.65
          });
        }
      }
    }catch{ /* Court entries remain valid even when the regions API is unavailable. */ }
  }catch{
    // Never insert missing or unverified records into the sitemap.
  }
  return result;
}
