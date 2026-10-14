import catalog from './research-courts.json';

export type ResearchCourt = {
  code: string;
  region: string;
  regionName: string;
  name: string;
  kind: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string;
  source: string;
  status: string;
};

const rows = catalog as ReadonlyArray<ResearchCourt>;

function validRow(court: ResearchCourt): boolean {
  // Only unreviewed sources from the known offline evidence files are exposed.
  // No arbitrary URL entered in the research corpus is trusted.
  const codeRegion = court.code.slice(0, 2);
  return court.status === 'unreviewed'
    && /^5[45](?:RS|OS|GV|KV|AJ)[0-9]{4}$/.test(court.code)
    && court.region === 'region-' + codeRegion
    && court.source.startsWith('https://sudrf.ru/index.php?')
    && /^https?:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.sudrf\.ru\/?$/i.test(court.website)
    && Boolean(court.name.trim() && court.address.trim());
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
    {slug:'region-54',name:'Новосибирская область',count:researchCourtsByRegion('region-54').length},
    {slug:'region-55',name:'Омская область',count:researchCourtsByRegion('region-55').length}
  ];
}

export function researchSearch(query: string): ResearchCourt[] {
  const needle=query.trim().toLocaleLowerCase('ru');
  if(needle.length<2||needle.length>100)return [];
  return candidates.filter(court=>[court.name,court.address,court.regionName,court.code]
    .some(value=>value.toLocaleLowerCase('ru').includes(needle))).slice(0,50);
}
