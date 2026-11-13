import data from '../data/moscow-judicial-appointment-events.json';

export type MoscowAppointmentEvent={
 courtSlug:string;name:string;
 eventType:'appointed_chair'|'appointed_to_moscow_city_court';
 newCourt:string;appointmentDate:string;decreeNumber:string;sourceUrl:string;observedOn:string;
};
const events=data.records as MoscowAppointmentEvent[];
const norm=(name:string)=>name.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
export function moscowJudgeAppointmentEvents(courtSlug:string,name:string){
 return events.filter(x=>x.courtSlug===courtSlug&&norm(x.name)===norm(name))
  .sort((a,b)=>b.appointmentDate.localeCompare(a.appointmentDate));
}
export function moscowCourtChairAppointment(courtSlug:string){
 return events.find(x=>x.courtSlug===courtSlug&&x.eventType==='appointed_chair')??null;
}
export const MOSCOW_RECENT_CHAIR_APPOINTMENTS=events.filter(x=>x.eventType==='appointed_chair');
