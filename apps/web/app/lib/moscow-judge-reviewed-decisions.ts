import registry from '../data/moscow-judge-reviewed-decisions.json';
import {MOSCOW_JUDGE_CASE_EVIDENCE,moscowJudgeSlug} from './moscow-judge-directory';

export type VerifiedJudicialReasoning={
 courtSlug:string;judgeName:string;caseNumber:string;
 courtCaseUrl:string;decisionDate:string;
 officialFileSha256:string;reviewedOn:string;
 attributionConfirmed:boolean;fullTextVerified:boolean;
 publicationPermissionChecked:boolean;personalDataReviewed:boolean;
 legalNorms:{law:string;article:string;reasoning:string}[];
 judicialReasoningSummary:string;
 appealStatus:'not_checked'|'appeal_source_verified';
};
const source=registry.records as unknown as VerifiedJudicialReasoning[];
function validLink(r:VerifiedJudicialReasoning){
 if(!r.attributionConfirmed||!r.fullTextVerified||!r.publicationPermissionChecked||!r.personalDataReviewed)return false;
 if(!/^[a-f0-9]{64}$/.test(r.officialFileSha256)||!r.legalNorms.length||!r.judicialReasoningSummary.trim())return false;
 const official=MOSCOW_JUDGE_CASE_EVIDENCE.find(c=>c.courtSlug===r.courtSlug&&c.number===r.caseNumber
  &&moscowJudgeSlug(c.judgeName)===moscowJudgeSlug(r.judgeName));
 if(!official||official.status!=='outcome_recorded'||official.topicId==='family')return false;
 try{
  const url=new URL(r.courtCaseUrl);
  return url.protocol==='https:'&&['mos-gorsud.ru','www.mos-gorsud.ru','m.mos-gorsud.ru'].includes(url.hostname)
   &&url.pathname.startsWith('/rs/')&&url.pathname.includes('/services/cases/')&&url.pathname.includes('/details/');
 }catch{return false;}
}
export function moscowJudgeReviewedDecisions(courtSlug:string,judgeName:string){
 return source.filter(r=>r.courtSlug===courtSlug
   &&moscowJudgeSlug(r.judgeName)===moscowJudgeSlug(judgeName)&&validLink(r));
}
