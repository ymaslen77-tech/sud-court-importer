import type {MetadataRoute} from 'next';
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
      result.push({
        url:new URL('/courts/'+court.region_slug+'/'+court.slug,site).toString(),
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
          result.push({
            url:new URL('/courts/'+region.slug,site).toString(),
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
