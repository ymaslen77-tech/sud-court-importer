/** Official-source public reference cards are NOT editor-approved registry records.
 * Data observed in the cited official sources on 2026-10-27. The source
 * retains authority on subsequent changes; people and individual cases are
 * deliberately not populated without their own supporting records.
 */
export type OfficialReferenceCourt = {
  slug:string; name:string;kind:string;region:string;regionName:string;
  address:string;phone:string;email:string;officialUrl:string;sourceUrl:string;
  casesUrl:string;judgesUrl:string|null;competence:string;
};

export const OFFICIAL_REFERENCE_COURTS:ReadonlyArray<OfficialReferenceCourt> = [
  {
    slug:'constitutional-court-rf',name:'Конституционный Суд Российской Федерации',
    kind:'constitutional',region:'federal',regionName:'Федеральный суд (вся Россия)',
    address:'190000, Санкт-Петербург, Сенатская площадь, д. 1',
    phone:'(812) 404-33-11',email:'ksrf@ksrf.ru',
    officialUrl:'https://www.ksrf.ru/',
    sourceUrl:'https://www.ksrf.ru/contacts.php',
    casesUrl:'https://www.ksrf.ru/Decision/',
    judgesUrl:null,
    competence:'Конституционное судопроизводство по вопросам, отнесённым к компетенции Конституционного Суда РФ.'
  },
  {
    slug:'altai-krai-court',name:'Алтайский краевой суд',
    kind:'general-regional',region:'region-22',regionName:'Алтайский край',
    address:'656043, Алтайский край, г. Барнаул, проспект Ленина, д. 25',
    phone:'(3852) 63-50-79',email:'kraevoy.alt@sudrf.ru',
    officialUrl:'https://kraevoy--alt.sudrf.ru/modules.php?name=sud',
    sourceUrl:'https://kraevoy--alt.sudrf.ru/modules.php?name=sud',
    casesUrl:'https://kraevoy--alt.sudrf.ru/modules.php?name=sud_delo',
    judgesUrl:null,
    competence:'Суд уровня субъекта Российской Федерации. Конкретная инстанционная компетенция зависит от вида производства и дела.'
  },
  {
    slug:'altai-arbitration-court',name:'Арбитражный суд Алтайского края',
    kind:'arbitration-subject',region:'region-22',regionName:'Алтайский край',
    address:'656015, Алтайский край, г. Барнаул, проспект Ленина, д. 76',
    phone:'(3852) 29-88-01',email:'a03.info@arbitr.ru',
    officialUrl:'https://altai-krai.arbitr.ru/',
    sourceUrl:'https://kraevoy--alt.sudrf.ru/modules.php?name=sud',
    casesUrl:'https://kad.arbitr.ru/',
    judgesUrl:null,
    competence:'Экономические споры и иные дела в пределах компетенции арбитражных судов.'
  },
  {
    slug:'barnaul-garrison-court',name:'Барнаульский гарнизонный военный суд',
    kind:'military-garrison',region:'region-22',regionName:'Алтайский край',
    address:'656056, Алтайский край, г. Барнаул, ул. Короленко, д. 5',
    phone:'(3852) 29-85-17',email:'bgvs.alt@sudrf.ru',
    officialUrl:'https://bgvs--alt.sudrf.ru/modules.php?name=sud',
    sourceUrl:'https://bgvs--alt.sudrf.ru/modules.php?name=sud',
    casesUrl:'https://bgvs--alt.sudrf.ru/modules.php?name=sud_delo',
    judgesUrl:null,
    competence:'Военные дела в пределах установленной федеральным законодательством компетенции гарнизонного суда.'
  },
  {
    slug:'aleysky-city-court',name:'Алейский городской суд Алтайского края',
    kind:'general-district',region:'region-22',regionName:'Алтайский край',
    address:'658130, Алтайский край, г. Алейск, ул. Советская, д. 98',
    phone:'(38553) 25-0-30',email:'aleysky.alt@sudrf.ru',
    officialUrl:'https://aleysky--alt.sudrf.ru/modules.php?name=sud',
    sourceUrl:'https://aleysky--alt.sudrf.ru/modules.php?name=sud',
    casesUrl:'https://aleysky--alt.sudrf.ru/modules.php?name=sud_delo',
    judgesUrl:null,
    competence:'Городской суд общей юрисдикции, рассматривающий предусмотренные законом категории дел.'
  }
];

export function officialReferenceCourt(slug:string):OfficialReferenceCourt|undefined {
  return OFFICIAL_REFERENCE_COURTS.find(c=>c.slug===slug);
}
export function officialReferenceMatches(q:string,kind:string,region:string):OfficialReferenceCourt[] {
  const needle=q.trim().toLocaleLowerCase('ru').replace(/ё/g,'е');
  return OFFICIAL_REFERENCE_COURTS.filter(c=>
    (!kind||c.kind===kind)&&(!region||c.region===region)&&
    (!needle||[c.name,c.address,c.regionName,c.kind].some(x=>
       x.toLocaleLowerCase('ru').replace(/ё/g,'е').includes(needle))));
}
