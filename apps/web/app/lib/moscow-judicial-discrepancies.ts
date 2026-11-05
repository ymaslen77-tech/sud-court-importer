import data from '../data/moscow-judicial-source-discrepancies.json';
type SourceConflict={courtSlug:string;publishedName:string;alternateSpelling:string;courtSource:string;cityCourtSource:string;decree:string;observedOn:string;status:string;resolution:string};
const norm=(n:string)=>n.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
export function moscowJudicialSourceConflict(courtSlug:string,name:string):SourceConflict|null{
 return (data.records as SourceConflict[]).find(r=>r.courtSlug===courtSlug&&norm(r.publishedName)===norm(name))??null;
}
