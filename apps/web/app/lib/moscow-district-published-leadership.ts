import data from '../data/moscow-district-published-leadership.json';

export type MoscowDistrictPublishedLeadership={
 slug:string;officialSlug:string;name:string;
 positionAsPublished:'chair'|'acting'|'status_disputed';
 expeditionPhone:string|null;sourceUrl:string;observedOn:string;
 currentAppointmentVerified:false;notice:string|null;
};
export const MOSCOW_PUBLISHED_LEADERSHIP:readonly MoscowDistrictPublishedLeadership[]=
 data.records as MoscowDistrictPublishedLeadership[];
const bySlug=new Map(MOSCOW_PUBLISHED_LEADERSHIP.map(x=>[x.slug,x]));
export function moscowPublishedLeadership(slug:string){return bySlug.get(slug)??null;}
