import {NextResponse} from 'next/server';
import {researchRegions} from '../../lib/research-courts';
import {verifiedBackendConfigured} from '../../lib/api';

export const dynamic='force-dynamic';

export function GET(){
  const regions=researchRegions();
  return NextResponse.json({
    project:'Суды России',
    status:'research-preview',
    verified_backend_configured:verifiedBackendConfigured,
    preliminary_records:regions.reduce((total,region)=>total+region.count,0),
    preliminary_regions:regions.map(region=>({slug:region.slug,count:region.count})),
    published_verified_count:'not_available_without_editorial_database',
    automated_source_collection:false,
    warning:'Preliminary court data has not passed individual editorial verification.'
  },{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
