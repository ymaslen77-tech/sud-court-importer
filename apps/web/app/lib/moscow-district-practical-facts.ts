import data from '../data/moscow-district-practical-facts.json';
export type MoscowPracticalSuboffice={label:string;schedule:string;phone:string|null};
export type MoscowPracticalFacts={
 slug:string; sourceUrl:string; sourceUpdatedOn:string|null; sourceReviewedOn?:string;
 accessiblePhone:string|null; anticorruptionPhone:string|null;
 travel:string|null; serviceHours:MoscowPracticalSuboffice[];notes:string[];
};
export const MOSCOW_PRACTICAL_SNAPSHOT_DATE=data.reviewedOn;
const factsByCourt=new Map((data.records as MoscowPracticalFacts[]).map(row=>[row.slug,row]));
export function moscowCourtPracticalFacts(courtSlug:string){
 return factsByCourt.get(courtSlug)??null;
}
