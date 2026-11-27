import source from '../data/moscow-appeal-hearing-snapshots.json';
import {moscowJudgeCaseCrosscheck} from './moscow-judge-crosschecks';

/** A dated official docket observation, never live schedule or appeal outcome. */
export type MoscowAppealHearingSnapshot={
 courtSlug:string;caseNumber:string;uin:string;
 appealDocket:string;appealCaseNumber:string;
 hearingDate:string;hearingTime:string;venueAsPublished:string;
 statusAsPublished:string;observedOn:string;sourceUrl:string;
 appealResult:null;judicialActTextVerified:false;note:string;
};
const rows=source.records as MoscowAppealHearingSnapshot[];

export function moscowAppealHearingSnapshot(courtSlug:string,caseNumber:string){
 const match=rows.find(x=>x.courtSlug===courtSlug&&x.caseNumber===caseNumber);
 if(!match||match.appealResult!==null||match.judicialActTextVerified!==false)return null;
 const cross=moscowJudgeCaseCrosscheck(courtSlug,caseNumber);
 const appeal=cross?.witnesses.find(w=>w.kind==='appeal_registry');
 if(!cross||!appeal||cross.uin!==match.uin
   ||cross.appealDocket!==match.appealDocket||appeal.sourceUrl!==match.sourceUrl
   ||!/^33-\d+\/20\d{2}$/.test(match.appealCaseNumber)
   ||!/^20\d{2}-\d{2}-\d{2}$/.test(match.hearingDate)
   ||!/^\d{2}:\d{2}$/.test(match.hearingTime)
   ||!/^20\d{2}-\d{2}-\d{2}$/.test(match.observedOn))return null;
 return match;
}
