/** Individual district-level source extracts verified on 2026-10-31.
 * Public numbers are taken from named court pages on mos-gorsud.ru.
 * These are source observations, not proof that a phone is reachable today.
 */
export type MoscowDistrictReviewedContact={
 courtUrl:string;
 expeditionPhone:string;
 archivePhone?:string;
 archiveHours?:string;
 hoursSourceUrl?:string;
 observedOn:string;
};
const details:Record<string,MoscowDistrictReviewedContact>={
 butyrskiy:{
  courtUrl:'https://mos-gorsud.ru/rs/butyrskij',
  expeditionPhone:'+7 (495) 482-30-00',
  archivePhone:'+7 (499) 488-86-08',
  archiveHours:'Понедельник и четверг с 09:00 до 18:00 по опубликованному расписанию',
  hoursSourceUrl:'https://www.mos-gorsud.ru/rs/butyrskij/help/hours',
  observedOn:'2026-10-31'
 },
 golovinskiy:{
  courtUrl:'https://mos-gorsud.ru/rs/golovinskij',
  expeditionPhone:'+7 (495) 450-28-14',
  observedOn:'2026-10-31'
 },
 izmaylovskiy:{
  courtUrl:'https://mos-gorsud.ru/rs/izmajlovskij',
  expeditionPhone:'+7 (499) 267-08-18',
  observedOn:'2026-10-31'
 },
 savelovskiy:{
  courtUrl:'https://mos-gorsud.ru/rs/savelovskij',
  expeditionPhone:'+7 (499) 251-86-98',
  observedOn:'2026-10-31'
 },
 tverskoy:{
  courtUrl:'https://mos-gorsud.ru/rs/tverskoj',
  expeditionPhone:'+7 (495) 694-09-24',
  archivePhone:'+7 (495) 694-18-52',
  archiveHours:'Среда с 09:00 до 18:00; в остальные будние дни приём архива не указан',
  hoursSourceUrl:'https://translate.mos-gorsud.ru/rs/tverskoj/help/hours',
  observedOn:'2026-10-31'
 }
};
export function moscowDistrictReviewedContact(slug:string){
 return details[slug]??null;
}
