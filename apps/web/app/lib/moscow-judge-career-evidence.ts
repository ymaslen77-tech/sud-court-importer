import source from '../data/moscow-judge-career-evidence.json';
export type JudgeCareerEvidence={
 slug:string;name:string;sourceUrl:string;sourceLastUpdated:string;
 facts:{date:string;description:string}[];note:string;
};
const bySlug=new Map((source.records as JudgeCareerEvidence[]).map(item=>[item.slug,item]));
export function moscowJudgeCareerEvidence(slug:string){return bySlug.get(slug)??null;}
