import raw from '../data/regional-arbitration-index.json';
import appellate from '../data/official-arbitration-appeals-districts.json';

// The records are names from a previously captured official arbitration list.
// They are NOT editor-approved courts, addresses, or proof of active jurisdiction.
export type RegionalArbitrationName = {
  courtName:string;
  courtKind:'arbitration-subject'|'arbitration-presence'|'arbitration-district';
  slug:string;
  regions:string[];
  sourceRecordUrl:string;
  editorialStatus:'unreviewed';
};
const northCaucasus=appellate.find(item=>item.courtKind==='arbitration-district'
  && item.courtName==='Арбитражный суд Северо-Кавказского округа');
const district:RegionalArbitrationName[] = northCaucasus?[{
  courtName:northCaucasus.courtName,
  courtKind:'arbitration-district',
  slug:'arbitration-district-north-caucasus',
  // District jurisdiction: physical seat remains Krasnodar, not every listed region.
  regions:['region-01','region-05','region-06','region-07','region-08','region-09',
    'region-15','region-20','region-23','region-26','region-61'],
  sourceRecordUrl:'https://arbitr.ru/',
  editorialStatus:'unreviewed'
}]:[];
const names:RegionalArbitrationName[]=[...(raw as RegionalArbitrationName[]),...district];
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
    (!kind||item.courtKind===kind)&&
    (!needle||item.courtName.toLocaleLowerCase('ru').replace(/ё/g,'е').includes(needle))
  );
}

export function regionalArbitrationHref(region:string,slug:string):string{
  return region==='moscow'
    ?'/courts/moscow/arbitration/'+encodeURIComponent(slug)
    :'/courts/'+encodeURIComponent(region)+'/'+encodeURIComponent(slug);
}
