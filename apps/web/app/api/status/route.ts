import {NextResponse} from 'next/server';
import {researchRegions} from '../../lib/research-courts';
import {pilotPublicCourts} from '../../lib/pilot-public';
import {verifiedBackendConfigured,getRegions} from '../../lib/api';

export const dynamic='force-dynamic';

export async function GET(){
  const regions=researchRegions();
  let publishedVerifiedCount:number|null=null;
  let verifiedBackendReachable=false;
  if(verifiedBackendConfigured){
    try{
      const verifiedRegions=await getRegions();
      publishedVerifiedCount=verifiedRegions.reduce((sum,r)=>sum+r.court_count,0);
      verifiedBackendReachable=true;
    }catch{
      // An API outage is not evidence of zero published courts.
    }
  }
  return NextResponse.json({
    project:'Суды России',
    status:'sourced-reference-pilot',
    published_source_reference_count:pilotPublicCourts().length,
    verified_backend_configured:verifiedBackendConfigured,
    preliminary_records:regions.reduce((total,region)=>total+region.count,0),
    preliminary_regions:regions.map(region=>({slug:region.slug,count:region.count})),
    verified_backend_reachable:verifiedBackendReachable,
    published_verified_count:publishedVerifiedCount,
    automated_source_collection:false,
    warning:'The ten public reference profiles cite available official publications; those profiles are not verified court records in Neon. Other research-only courts remain noindex.'
  },{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
