import data from './moscow-court-dossiers.json';

export type MoscowCase={number:string;case_type:string;subject:string;source_url:string};
export type MoscowCourt={
 slug:string;name:string;region:string;court_level:string;address:string;
 expedition_phone:string|null;email:string;office_hours:string;
 office_hours_is_department_hours:boolean;official_url:string;
 territory_service_url:string;case_service_url:string;jurisdiction_scope:string;
 notes:string;source_observed_on:string;current_details_attested:boolean;
 case_examples:MoscowCase[];full_address_boundary_verified:boolean;
 editorial_status:'research_only';
};
const entries=data as MoscowCourt[];
const bySlug=new Map(entries.map(item=>[item.slug,item]));
export function moscowCourts():MoscowCourt[]{return [...entries];}
export function moscowCourt(slug:string):MoscowCourt|null{return bySlug.get(slug)??null;}
export function officialMoscowUrl(value:string):string|null{
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
   (u.hostname==='mos-gorsud.ru'||u.hostname==='www.mos-gorsud.ru')?u.href:null;
 }catch{return null;}
}
