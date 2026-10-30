import database from '../data/moscow-official-minimum-registry.json';
import {moscowCourts} from './moscow-courts';

export type MoscowOfficialMinimumCourt={
 slug:string;name:string;kind:'general-regional'|'general-district';
 directory_code:string|null;address:string;
 other_locations:readonly {address:string;note:string}[];
 email:string;office_hours:string;lunch:string|null;metro:string|null;
 source_url:string;
 status:'official_directory_reference_unverified_live';
 general_hotline:string;
};
export const MOSCOW_OFFICIAL_MINIMUM_COURTS:ReadonlyArray<MoscowOfficialMinimumCourt>=
 database.records as MoscowOfficialMinimumCourt[];
export const MOSCOW_DIRECTORY_META=database.meta;
const bySlug=new Map(MOSCOW_OFFICIAL_MINIMUM_COURTS.map(x=>[x.slug,x]));
export const getMoscowOfficialMinimumCourt=(slug:string)=>bySlug.get(slug);
export function officialMoscowCourtKindLabel(c:MoscowOfficialMinimumCourt):string{
 return c.kind==='general-regional'?'Суд города федерального значения':'Районный суд общей юрисдикции';
}
function normalize(value:string):string{
 return value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
}
export function MoscowOfficialCourtHref(c:MoscowOfficialMinimumCourt):string{
 // Keep previously researched full dossiers as canonical pages; don't overwrite.
 const match=moscowCourts().find(x=>normalize(x.name).startsWith(normalize(c.name)));
 return match?'/courts/moscow/'+match.slug:'/courts/moscow/registry/'+c.slug;
}
