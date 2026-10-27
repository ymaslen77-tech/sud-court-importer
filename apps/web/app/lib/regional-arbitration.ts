import raw from '../data/regional-arbitration-index.json';
import cassation from '../data/arbitration-cassation-jurisdiction.json';

// The records are names from a previously captured official arbitration list.
// They are NOT editor-approved courts, addresses, or proof of active jurisdiction.
export type RegionalArbitrationName = {
  courtName:string;
  courtKind:'arbitration-subject'|'arbitration-presence'|'arbitration-district';
  slug:string;
  regions:string[];
  sourceRecordUrl:string;
  editorialStatus:'unreviewed';
  jurisdictionLawUrl?:string;
  officialCourtUrl?:string;
  address?:string;
  phone?:string;
  contactSourceUrl?:string;
};
const names: RegionalArbitrationName[] = [
  ...raw as RegionalArbitrationName[],
  ...cassation as RegionalArbitrationName[]
];
export function regionalArbitrationCourts(region?:string):RegionalArbitrationName[]{
  return names.filter(item=>!region||item.regions.includes(region));
}
export function regionalArbitrationCourt(region:string,slug:string):RegionalArbitrationName|null{
  return names.find(item=>item.slug===slug&&item.regions.includes(region))??null;
}
export function regionalArbitrationSearch(q:string,kind:string,region:string):RegionalArbitrationName[]{
  if(kind&&!['arbitration-subject','arbitration-district'].includes(kind))return [];
  const needle=q.trim().toLocaleLowerCase('ru').replace(/ё/g,'е');
  return regionalArbitrationCourts(region).filter(item=>
    (!kind||(kind==='arbitration-subject'?['arbitration-subject','arbitration-presence'].includes(item.courtKind):item.courtKind===kind))
    && (!needle||item.courtName.toLocaleLowerCase('ru').replace(/ё/g,'е').includes(needle))
  );
}

export function regionalArbitrationHref(region:string,slug:string):string{
  return region==='moscow'
    ?'/courts/moscow/arbitration/'+encodeURIComponent(slug)
    :'/courts/'+encodeURIComponent(region)+'/'+encodeURIComponent(slug);
}
