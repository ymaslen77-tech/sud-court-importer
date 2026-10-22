import raw from '../data/regional-arbitration-index.json';

// The records are names from a previously captured official arbitration list.
// They are NOT editor-approved courts, addresses, or proof of active jurisdiction.
export type RegionalArbitrationName = {
  courtName:string;
  courtKind:'arbitration-subject'|'arbitration-presence';
  slug:string;
  regions:string[];
  sourceRecordUrl:string;
  editorialStatus:'unreviewed';
};
const names = raw as RegionalArbitrationName[];
export function regionalArbitrationCourts(region?:string):RegionalArbitrationName[]{
  return names.filter(item=>!region||item.regions.includes(region));
}
export function regionalArbitrationCourt(region:string,slug:string):RegionalArbitrationName|null{
  return names.find(item=>item.slug===slug&&item.regions.includes(region))??null;
}
export function regionalArbitrationSearch(q:string,kind:string,region:string):RegionalArbitrationName[]{
  if(kind&&kind!=='arbitration-subject')return [];
  const needle=q.trim().toLocaleLowerCase('ru').replace(/ё/g,'е');
  return regionalArbitrationCourts(region).filter(item=>
    !needle||item.courtName.toLocaleLowerCase('ru').replace(/ё/g,'е').includes(needle)
  );
}

export function regionalArbitrationHref(region:string,slug:string):string{
  return region==='moscow'
    ?'/courts/moscow/arbitration/'+encodeURIComponent(slug)
    :'/courts/'+encodeURIComponent(region)+'/'+encodeURIComponent(slug);
}
