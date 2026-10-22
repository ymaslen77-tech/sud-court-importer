import {pushkinskyCourt} from './court-rich-records';

export type JudgeAppointmentEvidence={
  date:string;
  role:string;
  court:string;
  document:string;
  source:string;
  verification:'official_court'|'legal_text_secondary'|'secondary_reference';
  note?:string;
};
export type JudgeCaseEvidence={
  number:string;
  reviewedOn:string;
  category:string;
  url:string;
  note:string;
};
export type JudgeDossier={
  slug:string;region:string;name:string;
  courtSlug:string;courtName:string;publishedRole:string;
  publishedAppointment:string|undefined;
  rosterSource:string;rosterPublished:string;
  observedOn:string;
  historicalAppointments:JudgeAppointmentEvidence[];
  reviewedCases:JudgeCaseEvidence[];
  extraSources:{title:string;url:string;note:string}[];
};

const roster='https://pushkino--mo.sudrf.ru/modules.php?name=info_court&rid=1';
const history='https://pushkino--mo.sudrf.ru/modules.php?name=info_court&rid=3';
const contacts='https://pushkino--mo.sudrf.ru/modules.php?id=1&name=information';
const law2016='https://base.garant.ru/43134240/';
const legalReview='https://pravo.ru/arbitr_practice/judge/77321/';
// Deterministic Cyrillic transliteration; identifiers may need disambiguation when
// another person shares a full name in another court. Region and court are part of route.
const alphabet:Record<string,string>={
 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i',
 'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s',
 'т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
 'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
};
function judgeSlug(name:string):string{
 return name.toLocaleLowerCase('ru').trim().split('').map(c=>
   Object.prototype.hasOwnProperty.call(alphabet,c)?alphabet[c]:c
 ).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

const bazylevaAppointments:JudgeAppointmentEvidence[]=[
 {date:'2016-04-28',role:'Мировой судья судебного участка № 233 Сергиево-Посадского судебного района',
  court:'Судебный участок № 233',document:'Постановление Московской областной Думы № 3/164-П',
  source:law2016,verification:'legal_text_secondary',
  note:'Текст постановления воспроизведён правовой системой; первичная публикация газеты требует отдельной проверки'},
 {date:'2019-07-18',role:'Судья Сергиево-Посадского городского суда Московской области',
  court:'Сергиево-Посадский городской суд',document:'Указ Президента РФ № 345 от 18.07.2019',
  source:legalReview,verification:'secondary_reference',
  note:'Реквизиты приводятся вторичным юридическим справочником; оригинальный текст указа пока не сопоставлен'},
 {date:'2022-12-07',role:'Заместитель председателя Пушкинского городского суда',
  court:pushkinskyCourt.name,document:'Указ Президента РФ № 892 от 07.12.2022',
  source:legalReview,verification:'secondary_reference',
  note:'Реквизиты приводятся вторичным юридическим справочником; оригинальный текст указа пока не сопоставлен'},
 {date:'2024-11-14',role:'Председатель Пушкинского городского суда (назначение на шесть лет)',
  court:pushkinskyCourt.name,document:'Указ Президента РФ № 981 от 14.11.2024',
  source:contacts,verification:'official_court',
  note:'Сведения о должности и указе приведены в официальном справочнике суда; отсутствие более поздних изменений не аттестовано'}
];
const bazylevaCases:JudgeCaseEvidence[]=[
 {number:'11-2/2025',reviewedOn:'2025-02-12',category:'Гражданское дело — апелляция',
  url:'https://pushkino--mo.sudrf.ru/modules.php?case_id=904778046&case_uid=93fd9123-b544-43c7-a82b-4dd51adbd054&delo_id=5&name=sud_delo&name_op=case&new=5&srv_num=1',
  note:'В официальной карточке Базылева Т. А. указана судьёй; информация историческая, не онлайн-статистика'},
 {number:'11-119/2024',reviewedOn:'2024-05-28',category:'Гражданское дело — опубликованный материал о пересмотре',
  url:'https://pushkino--mo.sudrf.ru/modules.php?case_id=809041036&case_uid=e08a49b9-518f-4c24-9598-6e484a757465&delo_id=5&name=sud_delo&name_op=case&srv_num=1',
  note:'Проверяется связь судьи с конкретной исторической карточкой; не означает полного перечня дел'}
];
export const pushkinskyJudges:JudgeDossier[]=pushkinskyCourt.judges.map(person=>{
 const featured=person.name==='Базылева Татьяна Анатольевна';
 return {
   slug:judgeSlug(person.name),region:pushkinskyCourt.region,name:person.name,
   courtSlug:pushkinskyCourt.slug,courtName:pushkinskyCourt.name,
   publishedRole:person.role,publishedAppointment:person.appointment,
   rosterSource:person.source,rosterPublished:pushkinskyCourt.judgesPublished??'дата не определена',
   observedOn:'22.10.2026',
   historicalAppointments:featured?bazylevaAppointments:[],
   reviewedCases:featured?bazylevaCases:[],
   extraSources:featured?[
     {title:'Официальный исторический очерк суда',url:history,note:'Подтверждает, что Базылева возглавляет суд с 2024 года'},
     {title:'Официальный справочник состава и назначений',url:contacts,note:'Содержит указ № 981 от 14.11.2024'},
     {title:'Постановление Московской областной Думы № 3/164-П',url:law2016,note:'Текст акта представлен в правовой системе, не на официальном портале'},
     {title:'История указов о назначении — Право.ru',url:legalReview,note:'Вторичный источник для 2019 и 2022 годов, требует проверки оригиналов'}
    ]:[]
 };
});
export function getPushkinskyJudge(slug:string):JudgeDossier|undefined{
 return pushkinskyJudges.find(j=>j.slug===slug);
}
export function judgeProfileHref(judge:Pick<JudgeDossier,'region'|'slug'>):string{
 return '/judges/'+encodeURIComponent(judge.region)+'/'+encodeURIComponent(judge.slug);
}
export function judgeForName(name:string):JudgeDossier|undefined{
 return pushkinskyJudges.find(j=>j.name===name);
}
