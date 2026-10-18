import raw from './moscow-adjudicated-cases.json';
import {moscowCourt} from './moscow-courts';
import {MOSCOW_CASE_TOPICS} from './moscow-case-topics';
export type CourtPublishedDocument={
 kind:'pdf'|'text';localPath:string;sha256:string;verifiedOn:string;redactionReviewed:boolean;reusePermissionConfirmed:boolean;
};
export type AdjudicatedCase={
 court_slug:string;slug:string;number:string;topic_id:string;subject:string;
 decision_date:string;disposition:string;source_url:string;
 status:'official_docket_result';document_status:'awaiting_official_publication'|'source_document_not_ingested'|'published_verified';
 published_document:CourtPublishedDocument|null;researched_on:string;
};
const records=raw as unknown as AdjudicatedCase[];
export function officialCourtDocketUrl(raw:string,courtSlug:string):string|null{
 try{
  const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='m.mos-gorsud.ru'&&!u.port&&!u.username&&!u.password
   &&u.pathname.startsWith('/rs/'+courtSlug+'/services/cases/')?u.toString():null;
 }catch{return null;}
}
function permittedDocument(d:AdjudicatedCase):boolean{
 const doc=d.published_document;
 if(!doc||d.document_status!=='published_verified')return false;
 return doc.reusePermissionConfirmed&&doc.redactionReviewed&&/^[a-f0-9]{64}$/.test(doc.sha256)&&
  /^\/court-decisions\/[a-z0-9/_-]+\.(?:pdf|txt)$/.test(doc.localPath)&&
  doc.localPath.endsWith(doc.kind==='pdf'?'.pdf':'.txt');
}
export function isVerifiedDocument(d:AdjudicatedCase):boolean{return permittedDocument(d);}
export function adjudicatedCasesFor(courtSlug:string):AdjudicatedCase[]{
 if(!moscowCourt(courtSlug))return [];
 return records.filter(d=>d.court_slug===courtSlug&&officialCourtDocketUrl(d.source_url,courtSlug)
 &&MOSCOW_CASE_TOPICS.some(t=>t.id===d.topic_id)&&/^[0-9]{2}-[0-9]+\/20[0-9]{2}$/.test(d.number));
}
export function adjudicatedCase(courtSlug:string,slug:string):AdjudicatedCase|null{
 return adjudicatedCasesFor(courtSlug).find(d=>d.slug===slug)??null;
}
export const REQUIRED_DOCUMENTS_PER_COURT_TOPIC=50;
export function courtTopicCoverage(courtSlug:string,topicId:string):{confirmedResults:number;verifiedDocuments:number;target:number}{
 const records=adjudicatedCasesFor(courtSlug).filter(d=>d.topic_id===topicId);
 return {confirmedResults:records.length,verifiedDocuments:records.filter(isVerifiedDocument).length,target:REQUIRED_DOCUMENTS_PER_COURT_TOPIC};
}
