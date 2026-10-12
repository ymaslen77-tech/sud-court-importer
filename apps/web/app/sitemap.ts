import type {MetadataRoute} from 'next';
export const dynamic='force-dynamic';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const site=process.env.PUBLIC_SITE_URL??'http://localhost:4173';
  const pages=['/','/courts','/courts/types','/sources'];
  const result:MetadataRoute.Sitemap=pages.map(path=>({
    url:new URL(path,site).toString(),changeFrequency:'monthly',priority:path==='/'?1:.6
  }));
  try{
    const base=process.env.API_URL??'http://localhost:4000';
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
  }catch{
    // Never insert missing or unverified records into the sitemap.
  }
  return result;
}
