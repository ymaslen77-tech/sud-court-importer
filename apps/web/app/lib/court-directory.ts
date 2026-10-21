import original from '../data/official-arbitration-list.json';
import additional from '../data/official-arbitration-appeals-districts.json';
import {researchRegions,researchCourtsByRegion} from './research-courts';
import {pilotPublicCourts} from './pilot-public';
import {moscowCourts} from './moscow-courts';
import type {DirectoryEntry} from './court-directory-search';
export {DIRECTORY_REGIONS} from './directory-regions';

const COURT_KINDS_BY_CODE:Record<string,string>={
 RS:'general-district',OS:'general-regional',MS:'general-magistrate',
 AJ:'general-appeal',GV:'military-garrison',KV:'military-cassation'
};
/** Available entries are research material; this function never creates verified court records. */
export function directoryEntries():DirectoryEntry[]{
 const referenced=new Set(pilotPublicCourts().map(x=>x.external_code));
 const research=researchRegions().flatMap(r=>researchCourtsByRegion(r.slug)).map(c=>({
  id:'research:'+c.code,
  name:c.name,
  kind:COURT_KINDS_BY_CODE[c.code.slice(2,4)]??'general-district',
  kindLabel:c.kind,
  region:c.region,
  regionName:c.regionName,
  code:c.code,
  address:c.address,
  href:'/courts/'+c.region+'/sud-'+c.code.toLowerCase(),
  sourceUrl:c.source,
  status:referenced.has(c.code)?'reference' as const:'research' as const
 }));
 const moscow=moscowCourts().map(c=>({
  id:'moscow:'+c.slug,name:c.name,kind:'general-district',kindLabel:'Районный суд',
  region:'moscow',regionName:'Москва',code:null,address:c.address,
  href:'/courts/moscow/'+c.slug,sourceUrl:c.official_url,status:'research' as const
 }));
 const arbitration=[...original,...additional].map((c,i)=>({
  id:'arbitration:'+i+':'+c.courtName,
  name:c.courtName,
  kind:c.courtKind==='arbitration-presence'?'arbitration-subject':c.courtKind,
  kindLabel:c.courtKind==='arbitration-presence'?'Постоянное судебное присутствие':
   c.courtKind==='arbitration-subject'?'Арбитражный суд субъекта РФ':
   c.courtKind==='arbitration-appeal'?'Арбитражный апелляционный суд':
   c.courtKind==='arbitration-district'?'Арбитражный суд округа':'Суд по интеллектуальным правам',
  // Never infer territorial jurisdiction from a city or an arbitration court name.
  region:null,regionName:null,code:null,address:null,
  href:'/courts/arbitration',
  sourceUrl:c.sourceRecordUrl,
  status:'names' as const
 }));
 return [...research,...moscow,...arbitration];
}
export function directoryCounts(){
 const all=directoryEntries();
 return {total:all.length,research:all.filter(x=>x.status==='research').length,
  reference:all.filter(x=>x.status==='reference').length,
  names:all.filter(x=>x.status==='names').length,
  regionsWithEntries:new Set(all.map(x=>x.region).filter(Boolean)).size};
}
