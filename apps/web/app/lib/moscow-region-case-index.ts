import {MOSCOW_JUDGE_CASE_EVIDENCE} from './moscow-judge-directory';
import {moscowJudgeCaseCrosscheck} from './moscow-judge-crosschecks';
import {moscowAppealHearingSnapshot} from './moscow-appeal-hearing-snapshots';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS,MoscowOfficialCourtHref} from './moscow-official-minimum';
import {OFFICIAL_REFERENCE_COURTS} from './official-reference-courts';
import oblastIndex from '../data/moscow-oblast-appeal-index-samples.json';
import cachedAppeals from '../data/moscow-oblast-cached-appeals.json';
import {OBLAST_PORTAL_EVIDENCE} from './oblast-portal-evidence';
import {pushkinskyCourt} from './court-rich-records';

/** A convenience index over reviewed public metadata, NOT a complete court database.
 * Moscow oblast entries include dated listings and cached official case metadata, not verified acts.
 */
export type MoscowRegionCode='moscow'|'region-50';
export type MoscowRegionCase={
 id:string;region:MoscowRegionCode;courtSlug:string;courtName:string;
 courtHref:string;number:string;firstInstanceNumber:string|null;
 appealNumber:string|null;appealDocket:string|null;
 appealRegisteredOn:string|null;appealSourceUrl:string|null;
 appealHearingDate:string|null;appealHearingTime:string|null;appealHearingObservedOn:string|null;
 category:string;judgeName:string|null;
 proceeding:string;disposition:string|null;dispositionScope:'first_instance_registry'|'not_verified';
 observationDate:string;recordDate:string|null;
 sourceUrl:string;sourceIndexUrl:string|null;
 detailRead:boolean;fullTextVerified:false;appealResultVerified:false;
 evidenceStatus:'official_case_metadata'|'single_official_index_snapshot'|'cached_official_case_metadata';
};
export type MoscowRegionCourtOption={region:MoscowRegionCode;slug:string;name:string;href:string;
 officialUrl:string;officialCaseSearchUrl:string|null;caseSearchAddressOnly?:boolean};

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
  officialCaseSearchUrl:checkedOfficialDockets[c.slug]??OBLAST_PORTAL_EVIDENCE[c.slug]?.url??null,
  caseSearchAddressOnly:!!OBLAST_PORTAL_EVIDENCE[c.slug]})),
 {region:'region-50' as const,slug:pushkinskyCourt.slug,name:pushkinskyCourt.name,
  href:'/courts/'+pushkinskyCourt.region+'/'+pushkinskyCourt.slug,officialUrl:pushkinskyCourt.officialUrl,
  officialCaseSearchUrl:pushkinskyCourt.serviceLinks.find(x=>x.label==='Судебное делопроизводство и поиск дела')?.url??null,
  caseSearchAddressOnly:true}
].sort((a,b)=>a.region.localeCompare(b.region)||a.name.localeCompare(b.name,'ru'));

const moscowRecords:MoscowRegionCase[]=MOSCOW_JUDGE_CASE_EVIDENCE.flatMap(c=>{
 const court=moscowBySlug.get(c.courtSlug);
 if(!court)return [];
 // This crosscheck must match both official registers before appeal metadata
 // is displayed. The later hearing snapshot alone does not prove an outcome.
 const crosscheck=moscowJudgeCaseCrosscheck(c.courtSlug,c.number);
 const witness=crosscheck?.witnesses.find(w=>w.kind==='appeal_registry');
 const schedule=moscowAppealHearingSnapshot(c.courtSlug,c.number);
 return [{
  id:'moscow-'+c.courtSlug+'-'+c.number,
  region:'moscow',courtSlug:c.courtSlug,courtName:court.name,
  courtHref:MoscowOfficialCourtHref(court),
  number:c.number,firstInstanceNumber:c.number,
  appealNumber:schedule?.appealCaseNumber??null,
  appealDocket:crosscheck?.appealDocket??null,
  appealRegisteredOn:crosscheck?.appealRegisteredOn??null,
  appealSourceUrl:witness?.sourceUrl??null,
  appealHearingDate:schedule?.hearingDate??null,
  appealHearingTime:schedule?.hearingTime??null,
  appealHearingObservedOn:schedule?.observedOn??null,
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
  appealNumber:c.appealNumber,appealDocket:null,
  appealRegisteredOn:null,appealSourceUrl:null,
  appealHearingDate:null,appealHearingTime:null,appealHearingObservedOn:null,
  category:c.category,judgeName:null,
  proceeding:'civil_appeal',
  disposition:null,dispositionScope:'not_verified',
  observationDate:oblastIndex.observedOn,recordDate:oblastIndex.listingDate,
  sourceUrl:c.sourceCaseUrl,sourceIndexUrl:oblastIndex.sourceIndexUrl,
  detailRead:false,fullTextVerified:false,appealResultVerified:false,
  evidenceStatus:'single_official_index_snapshot'
 } satisfies MoscowRegionCase];
});

const cachedOblastRecords:MoscowRegionCase[]=cachedAppeals.records.flatMap(c=>{
 const court=oblastBySlug.get(c.courtSlug);
 if(!court||court.name!==c.courtName)return [];
 return [{
  id:'oblast-'+c.appealNumber,region:'region-50',courtSlug:c.courtSlug,courtName:c.courtName,
  courtHref:'/courts/reference/'+c.courtSlug,number:c.appealNumber,
  firstInstanceNumber:c.firstInstanceNumber,appealNumber:c.appealNumber,appealDocket:null,
  appealRegisteredOn:null,appealSourceUrl:null,appealHearingDate:null,appealHearingTime:null,
  appealHearingObservedOn:null,category:c.category,judgeName:null,proceeding:'civil_appeal',
  disposition:null,dispositionScope:'not_verified',observationDate:cachedAppeals.reviewedOn,
  recordDate:null,sourceUrl:c.sourceCaseUrl,sourceIndexUrl:null,
  detailRead:false,fullTextVerified:false,appealResultVerified:false,
  evidenceStatus:'cached_official_case_metadata'
 } satisfies MoscowRegionCase];
});
export const MOSCOW_REGION_CASES:ReadonlyArray<MoscowRegionCase>=[
 ...new Map([...moscowRecords,...cachedOblastRecords,...oblastRecords].map(c=>[c.id,c])).values()
];
export const MOSCOW_OBLAST_LISTING_DATE=oblastIndex.listingDate;
export const MOSCOW_OBLAST_LISTING_SOURCE=oblastIndex.sourceIndexUrl;
