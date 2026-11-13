import archive from '../data/moscow-judicial-source-briefs.json';

export type JudicialSourceBrief={
 slug:string;
 sourceType:'official_appointment_notices'|'official_judicial_assistant_directory';
 recordDate:string;
 sourceUpdatedOn?:string;
 people:{name:string;basis:string;sourceUrl:string}[];
 note:string;
};
const bySlug=new Map((archive.records as JudicialSourceBrief[]).map(item=>[item.slug,item]));
export function moscowJudicialSourceBrief(slug:string){return bySlug.get(slug)??null;}
