import database from '../data/moscow-district-individual-dossiers.json';

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
  stateDuty:root+'/services/gosposhlina',
  appeal:root+'/services/appeal-order'
 };
}
