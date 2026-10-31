import rosterFile from '../data/moscow-district-judges-samples.json';
import legacyRosters from '../data/moscow-legacy-judge-rosters.json';
import briefsFile from '../data/moscow-judicial-source-briefs.json';
import caseFile from '../data/moscow-judge-case-evidence.json';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS,MoscowOfficialCourtHref} from './moscow-official-minimum';

type JudgeSourceKind='official_roster'|'official_appointment_news'|'official_assistant_reference';
export type MoscowJudgeProfile={
 courtSlug:string;
 courtName:string;
 courtHref:string;
 name:string;
 judgeSlug:string;
 sourceUrl:string;
 sourceObservedOn:string;
 sourceUpdatedOn:string|null;
 sourceKind:JudgeSourceKind;
 appointmentBasis:string|null;
};
export type JudgeCaseEvidence={
 courtSlug:string;
 judgeName:string;
 number:string;
 proceeding:'civil'|'criminal'|'criminal-materials';
 topicId:string;
 category:string;
 status:'outcome_recorded'|'pending';
 outcome:string;
 decisionDate:string|null;
 sourceUrl:string;
 evidenceLevel:'official_case_list';
 judicialActTextVerified:false;
 judgeAttribution:'judge_and_number_in_same_official_row';
 observedOn:string;
 note:string;
};
const normalize=(s:string)=>s.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const translit:Record<string,string>={
 а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',
 о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ы:'y',э:'e',ю:'yu',я:'ya',
 ь:'',ъ:''
};
export function moscowJudgeSlug(name:string):string{
 return name.toLocaleLowerCase('ru').split('').map(c=>translit[c]??(c.match(/[a-z0-9]/)?c:'-'))
   .join('').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
const byCourt=new Map(MOSCOW_OFFICIAL_MINIMUM_COURTS.map(c=>[c.slug,c]));
const records:MoscowJudgeProfile[]=[];
for(const r of [...rosterFile.records,...legacyRosters.records]){
 const court=byCourt.get(r.slug);
 if(!court||court.kind!=='general-district')continue;
 for(const name of r.judges){
  const note=r.appointmentNotes.find(v=>normalize(v.name)===normalize(name));
  records.push({courtSlug:r.slug,courtName:court.name,courtHref:MoscowOfficialCourtHref(court),
    name,judgeSlug:moscowJudgeSlug(name),sourceUrl:r.sourceUrl,
    sourceObservedOn:r.observedOn,sourceUpdatedOn:r.sourceLastUpdated,
    sourceKind:'official_roster',appointmentBasis:note?.decree??null});
 }
}
for(const r of briefsFile.records){
 const court=byCourt.get(r.slug);
 if(!court||court.kind!=='general-district')continue;
 for(const item of r.people){
  records.push({courtSlug:r.slug,courtName:court.name,courtHref:MoscowOfficialCourtHref(court),
    name:item.name,judgeSlug:moscowJudgeSlug(item.name),sourceUrl:item.sourceUrl,
    sourceObservedOn:r.recordDate,sourceUpdatedOn:'sourceUpdatedOn' in r?r.sourceUpdatedOn??null:null,
    sourceKind:r.sourceType==='official_appointment_notices'?'official_appointment_news':'official_assistant_reference',
    appointmentBasis:item.basis});
 }
}
export const MOSCOW_JUDGE_PROFILES:ReadonlyArray<MoscowJudgeProfile>=records.sort((a,b)=>
 a.courtName.localeCompare(b.courtName,'ru')||a.name.localeCompare(b.name,'ru'));
export function moscowJudgeProfilesForCourt(slug:string){
 return MOSCOW_JUDGE_PROFILES.filter(p=>p.courtSlug===slug);
}
export function moscowJudgeProfile(courtSlug:string,judgeSlug:string){
 return MOSCOW_JUDGE_PROFILES.find(p=>p.courtSlug===courtSlug&&p.judgeSlug===judgeSlug)??null;
}
export function moscowJudgeHref(p:MoscowJudgeProfile){
 return '/courts/moscow/judges/'+p.courtSlug+'/'+p.judgeSlug;
}
export const MOSCOW_JUDGE_CASE_EVIDENCE:ReadonlyArray<JudgeCaseEvidence>=caseFile.records as JudgeCaseEvidence[];
export function moscowJudgeCases(courtSlug:string,name:string):JudgeCaseEvidence[]{
 const judge=moscowJudgeProfile(courtSlug,moscowJudgeSlug(name));
 if(!judge)return [];
 return MOSCOW_JUDGE_CASE_EVIDENCE.filter(c=>c.courtSlug===courtSlug&&normalize(c.judgeName)===normalize(judge.name));
}
export function moscowJudgeCaseCategories(cases:ReadonlyArray<JudgeCaseEvidence>){
 const m=new Map<string,{topicId:string;category:string;total:number;withRecordedOutcome:number}>();
 for(const c of cases){
  const key=c.topicId;
  const row=m.get(key)??{topicId:key,category:c.category,total:0,withRecordedOutcome:0};
  row.total+=1;if(c.status==='outcome_recorded')row.withRecordedOutcome+=1;
  m.set(key,row);
 }
 return [...m.values()].sort((a,b)=>b.total-a.total||a.category.localeCompare(b.category,'ru'));
}
export function moscowJudgeSourceLabel(source:JudgeSourceKind){
 if(source==='official_roster')return 'Официальный опубликованный список судей';
 if(source==='official_appointment_news')return 'Официальное сообщение о назначении';
 return 'Упоминание в перечне помощников (полномочия не подтверждены)';
}
