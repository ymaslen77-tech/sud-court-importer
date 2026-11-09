/** Official-source public reference cards are NOT editor-approved registry records.
 * Data observed in the cited official sources on 2026-10-27. The source
 * retains authority on subsequent changes; people and individual cases are
 * deliberately not populated without their own supporting records.
 */
export type OfficialReferenceCourt = {
  slug:string; name:string;kind:string;region:string;regionName:string;
  address:string;phone:string;email:string;officialUrl:string;sourceUrl:string;
  casesUrl:string;judgesUrl:string|null;competence:string;
  observedOn?:string;
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
  },

  {
    slug:"moscow-oblast-court",name:"Московский областной суд",
    kind:"general-regional",region:'region-50',regionName:'Московская область',
    address:"143411, Московская обл., г. Красногорск, бульвар Строителей, д. 4, корп. 3",phone:"+7 (498) 692-60-00",email:"post.50os0000@sudrf.ru",
    officialUrl:'http://oblsud.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://oblsud.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Суд уровня субъекта Российской Федерации; полномочия зависят от вида судопроизводства и стадии дела."
  },

  {
    slug:"balashikha-city-court",name:"Балашихинский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143907, Московская обл., г. Балашиха, шоссе Энтузиастов, д. 39А",phone:"8 (495) 521-16-71",email:"Balashihinsky.mo@sudrf.ru",
    officialUrl:'http://balashihinsky.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://balashihinsky.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"vidnoe-city-court",name:"Видновский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142700, Московская обл., г. Видное, ул. Центральная, д. 2",phone:"8 (495) 541-43-44",email:"vidnoe.mo@sudrf.ru",
    officialUrl:'http://vidnoe.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://vidnoe.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"dmitrov-city-court",name:"Дмитровский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141800, Московская обл., г. Дмитров, ул. Загорская, д. 18",phone:"8 (496) 225-44-31",email:"dmitrov.mo@sudrf.ru",
    officialUrl:'http://dmitrov.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://dmitrov.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"domodedovo-city-court",name:"Домодедовский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142000, Московская обл., г. Домодедово, ул. Советская, д. 26",phone:"8 (496) 793-28-26",email:"domodedovo.mo@sudrf.ru",
    officialUrl:'http://domodedovo.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://domodedovo.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"dubna-city-court",name:"Дубненский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141980, Московская обл., г. Дубна, ул. Курчатова, д. 28",phone:"8 (496) 214-03-51",email:"dubna.mo@sudrf.ru",
    officialUrl:'http://dubna.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://dubna.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"egorievsk-city-court",name:"Егорьевский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140300, Московская обл., г. Егорьевск, просп. Ленина, д. 12",phone:"8 (496) 404-18-76",email:"egorievsk.mo@sudrf.ru",
    officialUrl:'http://egorievsk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://egorievsk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"zhukovsky-city-court",name:"Жуковский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140185, Московская обл., г. Жуковский, ул. Ф. Калугина, д. 9",phone:"8 (495) 556-99-49",email:"zhukovsk.mo@sudrf.ru",
    officialUrl:'http://zhukovsk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://zhukovsk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"kolomna-city-court",name:"Коломенский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140400, Московская обл., г. Коломна, ул. Гражданская, д. 5",phone:"8 (496) 612-23-73",email:"kolomna.mo@sudrf.ru",
    officialUrl:'http://kolomna.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://kolomna.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"korolev-city-court",name:"Королёвский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141070, Московская обл., г. Королёв, ул. Коминтерна, д. 2",phone:"8 (495) 516-66-65",email:"korolev.mo@sudrf.ru",
    officialUrl:'http://korolev.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://korolev.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"ramenskoe-city-court",name:"Раменский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140100, Московская обл., г. Раменское, ул. Вокзальная, д. 2",phone:"8 (496) 463-24-60",email:"ramenskoe.mo@sudrf.ru",
    officialUrl:'http://ramenskoe.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://ramenskoe.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"serpukhov-city-court",name:"Серпуховский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142214, Московская обл., г. Серпухов, ул. Ворошилова, д. 186",phone:"8 (496) 737-51-35",email:"serpuhov.mo@sudrf.ru",
    officialUrl:'http://serpuhov.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://serpuhov.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"khimki-city-court",name:"Химкинский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141402, Московская обл., г. Химки, ул. Ленинградская, д. 13Б",phone:"8 (498) 691-35-16",email:"himki.mo@sudrf.ru",
    officialUrl:'http://himki.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://himki.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"chekhov-city-court",name:"Чеховский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142300, Московская обл., г. Чехов, ул. Чехова, д. 24",phone:"8 (496) 726-83-41",email:"chehov.mo@sudrf.ru",
    officialUrl:'http://chehov.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://chehov.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
  },

  {
    slug:"shelkovo-city-court",name:"Щёлковский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141100, Московская обл., г. Щёлково, пл. Ленина, д. 5",phone:"8 (496) 562-94-66",email:"shelkovo.mo@sudrf.ru",
    officialUrl:'http://shelkovo.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://shelkovo.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:"Городской суд общей юрисдикции. Рассматривает дела в пределах установленной законом подсудности."
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
