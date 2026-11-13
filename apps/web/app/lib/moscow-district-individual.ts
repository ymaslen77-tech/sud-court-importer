import database from '../data/moscow-district-individual-dossiers.json';
import {moscowCourtPracticalFacts} from './moscow-district-practical-facts';

export type MoscowDistrictIndividual={
 slug:string;
 officialSlug:string;
 officialUrl:string;
 contactsSourceUrl:string;
 expeditionPhone:string|null;
 chairPublished:string|null;
 chairStatus:'as_published'|'acting_as_published'|'conflicting_sources';
 emailAsPublished:string|null;
 sourceObservedOn:string;
 remarks:string[];
};
export const MOSCOW_DISTRICT_INDIVIDUALS:ReadonlyArray<MoscowDistrictIndividual>=database.records as MoscowDistrictIndividual[];
const bySlug=new Map(MOSCOW_DISTRICT_INDIVIDUALS.map(item=>[item.slug,item]));
export function moscowDistrictIndividual(slug:string):MoscowDistrictIndividual|null{
 return bySlug.get(slug)??null;
}
export function moscowDistrictOfficialPages(court:MoscowDistrictIndividual){
 const root=court.officialUrl;
 return {
  overview:root,
  contacts:court.contactsSourceUrl,
  cases:root+'/services/cases',
  territory:root+'/services/territorial',
  courtStructure:root+'/structure',
  stateDuty:root,
  appeal:root
 };
}

// All 35 district courts have a source-attributed official hours/contacts
// page. Twelve previously researched rich courts do not have a separate
// individual-profile row: derive the official court root only from that
// validated exact original source, never from a guessed transliteration.
export function moscowDistrictOfficialPagesBySlug(slug:string){
 const individual=moscowDistrictIndividual(slug);
 if(individual)return moscowDistrictOfficialPages(individual);
 const facts=moscowCourtPracticalFacts(slug);
 if(!facts)return null;
 const m=/^https:\/\/(?:(?:www|m|mks|interportal)\.)?mos-gorsud\.ru\/rs\/([a-z0-9-]+)\/(?:help\/hours|hours)$/.exec(facts.sourceUrl);
 if(!m)return null;
 const root='https://mos-gorsud.ru/rs/'+m[1];
 return {overview:root,contacts:facts.sourceUrl,cases:root+'/services/cases',
  territory:root+'/services/territorial',courtStructure:root+'/structure',
  stateDuty:root,appeal:root};
}
