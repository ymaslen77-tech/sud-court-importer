import catalog from './research-courts.json';
import magistrates from './research-magistrates.json';

export type ResearchCourt = {
  code: string;
  region: string;
  regionName: string;
  name: string;
  kind: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  source: string;
  status: string;
};

const rows: ReadonlyArray<ResearchCourt> = [...catalog,...magistrates];

function validRow(court: ResearchCourt): boolean {
  const codeRegion=court.code.slice(0,2);
  if(court.status!=='unreviewed'||court.region!=='region-'+codeRegion)return false;
  if(!/^([0-9]{2})(?:RS|OS|GV|KV|AJ|MS)[0-9]{4}$/.test(court.code))return false;
  if(!court.name.trim()||!court.regionName.trim())return false;
  if(!/^https:\/\/sudrf\.ru\/index\.php\?/.test(court.source))return false;
  if(court.code.includes('MS')){
    const match=/^27MS([0-9]{4})$/.exec(court.code);
    const number=match?Number(match[1]):0;
    return court.region==='region-27' && number>=1 && number<=75
      && court.website==='http://'+number+'.hbr.msudrf.ru'
      && court.address===null
      && court.source.includes('act=go_ms_search');
  }
  return (codeRegion==='54'||codeRegion==='55') && Boolean(court.address?.trim())
    && typeof court.website==='string'
    && /^https?:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.sudrf\.ru\/?$/i.test(court.website)
    && court.source.includes('act=go_search');
}

const candidates = rows.filter(validRow);
const byKey = new Map(candidates.map(court=>[court.region + '/sud-' + court.code.toLowerCase(),court]));

export function researchCourt(region: string, slug: string): ResearchCourt | null {
  return byKey.get(region + '/' + slug) ?? null;
}

export function researchCourtsByRegion(region: string): ResearchCourt[] {
  return candidates.filter(court=>court.region===region);
}

export function researchRegions(): {slug:string;name:string;count:number}[] {
  return [
    {slug:'region-27',name:'Хабаровский край',count:researchCourtsByRegion('region-27').length},
    {slug:'region-54',name:'Новосибирская область',count:researchCourtsByRegion('region-54').length},
    {slug:'region-55',name:'Омская область',count:researchCourtsByRegion('region-55').length}
  ];
}

export function researchSearch(query: string): ResearchCourt[] {
  const needle=query.trim().toLocaleLowerCase('ru');
  if(needle.length<2||needle.length>100)return [];
  return candidates.filter(court=>[court.name,court.address??'',court.regionName,court.code]
    .some(value=>value.toLocaleLowerCase('ru').includes(needle))).slice(0,50);
}
