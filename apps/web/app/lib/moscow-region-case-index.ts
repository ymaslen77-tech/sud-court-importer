import {MOSCOW_JUDGE_CASE_EVIDENCE} from './moscow-judge-directory';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS,MoscowOfficialCourtHref} from './moscow-official-minimum';
import {OFFICIAL_REFERENCE_COURTS} from './official-reference-courts';
import oblastIndex from '../data/moscow-oblast-appeal-index-samples.json';

/** A convenience index over reviewed public metadata, NOT a complete court database.
 * The Moscow oblast cards are a single dated official LISTING, not read court acts.
 */
export type MoscowRegionCode='moscow'|'region-50';
export type MoscowRegionCase={
 id:string;region:MoscowRegionCode;courtSlug:string;courtName:string;
 courtHref:string;number:string;firstInstanceNumber:string|null;
 appealNumber:string|null;category:string;judgeName:string|null;
 proceeding:string;disposition:string|null;dispositionScope:'first_instance_registry'|'not_verified';
 observationDate:string;recordDate:string|null;
 sourceUrl:string;sourceIndexUrl:string|null;
 detailRead:boolean;fullTextVerified:false;appealResultVerified:false;
 evidenceStatus:'official_case_metadata'|'single_official_index_snapshot';
};
export type MoscowRegionCourtOption={region:MoscowRegionCode;slug:string;name:string;href:string;
 officialUrl:string;officialCaseSearchUrl:string|null};

const moscowCourts=MOSCOW_OFFICIAL_MINIMUM_COURTS
 .filter(c=>c.kind==='general-district'||c.kind==='general-regional');
const oblastCourts=OFFICIAL_REFERENCE_COURTS.filter(c=>c.region==='region-50'&&
 (c.kind==='general-district'||c.kind==='general-regional'));
const moscowBySlug=new Map(moscowCourts.map(c=>[c.slug,c]));
const oblastBySlug=new Map(oblastCourts.map(c=>[c.slug,c]));
const checkedOfficialDockets:Readonly<Record<string,string>>={
 'moscow-oblast-court':'https://oblsud--mo.sudrf.ru/modules.php?name=sud_delo'
};

export const MOSCOW_REGION_COURTS:ReadonlyArray<MoscowRegionCourtOption>=[
 ...moscowCourts.map(c=>({region:'moscow' as const,slug:c.slug,name:c.name,
  href:MoscowOfficialCourtHref(c),officialUrl:c.source_url,
  officialCaseSearchUrl:'https://mos-gorsud.ru/search'})),
 ...oblastCourts.map(c=>({region:'region-50' as const,slug:c.slug,name:c.name,
  href:'/courts/reference/'+c.slug,officialUrl:c.officialUrl,
  officialCaseSearchUrl:checkedOfficialDockets[c.slug]??null}))
].sort((a,b)=>a.region.localeCompare(b.region)||a.name.localeCompare(b.name,'ru'));

const moscowRecords:MoscowRegionCase[]=MOSCOW_JUDGE_CASE_EVIDENCE.flatMap(c=>{
 const court=moscowBySlug.get(c.courtSlug);
 if(!court)return [];
 return [{
  id:'moscow-'+c.courtSlug+'-'+c.number,
  region:'moscow',courtSlug:c.courtSlug,courtName:court.name,
  courtHref:MoscowOfficialCourtHref(court),
  number:c.number,firstInstanceNumber:c.number,appealNumber:null,
  category:c.category,judgeName:c.judgeName,proceeding:c.proceeding,
  disposition:c.status==='outcome_recorded'?c.outcome:null,
  dispositionScope:c.status==='outcome_recorded'?'first_instance_registry':'not_verified',
  observationDate:c.observedOn,recordDate:c.decisionDate,
  sourceUrl:c.sourceUrl,sourceIndexUrl:null,
  detailRead:true,fullTextVerified:false,appealResultVerified:false,
  evidenceStatus:'official_case_metadata'
 } satisfies MoscowRegionCase];
});

const oblastRecords:MoscowRegionCase[]=oblastIndex.records.flatMap(c=>{
 const court=oblastBySlug.get(c.courtSlug);
 if(!court||court.name!==c.courtName)return [];
 return [{
  id:'oblast-'+c.appealNumber,
  region:'region-50',courtSlug:c.courtSlug,courtName:c.courtName,
  courtHref:'/courts/reference/'+c.courtSlug,
  number:c.appealNumber,firstInstanceNumber:c.firstInstanceNumber,
  appealNumber:c.appealNumber,category:c.category,judgeName:null,
  proceeding:'civil_appeal',
  disposition:null,dispositionScope:'not_verified',
  observationDate:oblastIndex.observedOn,recordDate:oblastIndex.listingDate,
  sourceUrl:c.sourceCaseUrl,sourceIndexUrl:oblastIndex.sourceIndexUrl,
  detailRead:false,fullTextVerified:false,appealResultVerified:false,
  evidenceStatus:'single_official_index_snapshot'
 } satisfies MoscowRegionCase];
});

export const MOSCOW_REGION_CASES:ReadonlyArray<MoscowRegionCase>=[
 ...new Map([...moscowRecords,...oblastRecords].map(c=>[c.id,c])).values()
];
export const MOSCOW_OBLAST_LISTING_DATE=oblastIndex.listingDate;
export const MOSCOW_OBLAST_LISTING_SOURCE=oblastIndex.sourceIndexUrl;
