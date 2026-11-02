import source from '../data/moscow-judge-crosschecked-cases.json';
import {MOSCOW_JUDGE_CASE_EVIDENCE,moscowJudgeSlug} from './moscow-judge-directory';

export type CourtCrossRegisterWitness={
 kind:'first_instance'|'appeal_registry'; sourceUrl:string;issuer:string;uin:string;
 caseNumber:string;judgeLabel:string;categoryCode:string;
 firstInstanceOutcome:string|null;appealRegisteredOn:string|null;
};
export type MoscowJudgeCrosscheckedCase={
 courtSlug:string;judgeName:string;caseNumber:string;uin:string;categoryCode:string;
 courtDecisionDate:string;courtOutcome:string;appealDocket:string;appealRegisteredOn:string;
 appealResult:null;reviewedOn:string;verificationLevel:'official_cross_register_agreement';
 sourceGroup:'mos_gorsud_first_instance_and_appeal';fullTextVerified:false;
 witnesses:CourtCrossRegisterWitness[];note:string;
};
const rows=source.records as MoscowJudgeCrosscheckedCase[];
function supported(row:MoscowJudgeCrosscheckedCase){
 const original=MOSCOW_JUDGE_CASE_EVIDENCE.find(c=>
  c.courtSlug===row.courtSlug&&c.number===row.caseNumber
  &&moscowJudgeSlug(c.judgeName)===moscowJudgeSlug(row.judgeName));
 if(!original||original.status!=='outcome_recorded'||original.outcome!==row.courtOutcome
  ||original.decisionDate!==row.courtDecisionDate||row.appealResult!==null||row.fullTextVerified!==false)return false;
 if(row.witnesses.length!==2||new Set(row.witnesses.map(w=>w.kind)).size!==2)return false;
 const first=row.witnesses.find(w=>w.kind==='first_instance');
 const appeal=row.witnesses.find(w=>w.kind==='appeal_registry');
 if(!first||!appeal||first.firstInstanceOutcome!==row.courtOutcome||appeal.firstInstanceOutcome!==null
  ||appeal.appealRegisteredOn!==row.appealRegisteredOn)return false;
 return row.witnesses.every(w=>w.uin===row.uin&&w.caseNumber===row.caseNumber
   &&w.categoryCode===row.categoryCode&&w.judgeLabel===first.judgeLabel
   &&(/^https:\/\/(?:m\.|www\.)?mos-gorsud\.ru\//).test(w.sourceUrl));
}
export function moscowJudgeCaseCrosscheck(courtSlug:string,caseNumber:string){
 return rows.find(r=>r.courtSlug===courtSlug&&r.caseNumber===caseNumber&&supported(r))??null;
}
export function moscowJudgeVerifiedCrosschecks(courtSlug:string,judgeName:string){
 return rows.filter(r=>r.courtSlug===courtSlug
  &&moscowJudgeSlug(r.judgeName)===moscowJudgeSlug(judgeName)&&supported(r));
}
