import judges from '../data/moscow-district-judges-samples.json';
import cases from '../data/moscow-district-sourced-case-samples.json';

export type MoscowJudgeRoster={
 slug:string;
 officialSlug:string;
 sourceUrl:string;
 sourceLastUpdated:string;
 observedOn:string;
 status:'published_roster_not_live_certification';
 judges:string[];
 appointmentNotes:{name:string;decree:string}[];
};
export type MoscowDocketExample={
 number:string;
 category:string;
 sourceStatus:string;
};
export type MoscowCourtDocketExamples={
 slug:string;
 officialSlug:string;
 sourceUrl:string;
 sourceObservedOn:string;
 sourceCategory:string;
 finalDecisionConfirmed:boolean;
 cases:MoscowDocketExample[];
};
const judgeMap=new Map((judges.records as MoscowJudgeRoster[]).map(c=>[c.slug,c]));
const caseMap=new Map((cases.records as MoscowCourtDocketExamples[]).map(c=>[c.slug,c]));
export function moscowJudgeRoster(slug:string){return judgeMap.get(slug)??null;}
export function moscowCourtCaseExamples(slug:string){return caseMap.get(slug)??null;}
export const MOSCOW_ROSTER_EVIDENCE_COUNT=judges.records.length;
export const MOSCOW_DOCKET_EVIDENCE_COUNT=cases.records.length;
