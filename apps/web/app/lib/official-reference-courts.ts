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
,
  {
    slug:"volokolamsk-city-court",name:"Волоколамский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143600, Московская обл., г. Волоколамск, ул. Пролетарская, д. 10А",phone:"8 (496) 362-58-76",email:"volokolamsk.mo@sudrf.ru",
    officialUrl:'http://volokolamsk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://volokolamsk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"voskresensk-city-court",name:"Воскресенский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140200, Московская обл., г. Воскресенск, ул. Советская, д. 5",phone:"8 (991) 788-14-12",email:"voskresensk.mo@sudrf.ru",
    officialUrl:'http://voskresensk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://voskresensk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"dolgoprudny-city-court",name:"Долгопрудненский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141700, Московская обл., г. Долгопрудный, ул. Первомайская, д. 13/3",phone:"8 (495) 408-70-11",email:"dolgoprudniy.mo@sudrf.ru",
    officialUrl:'http://dolgoprudniy.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://dolgoprudniy.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"zheleznodorozhny-city-court",name:"Железнодорожный городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143980, Московская обл., г. Железнодорожный, ул. Октябрьская, д. 31",phone:"8 (495) 527-48-43",email:"zheleznodorojniy.mo@sudrf.ru",
    officialUrl:'http://zheleznodorojniy.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://zheleznodorojniy.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"zaraysk-city-court",name:"Зарайский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140600, Московская обл., г. Зарайск, ул. Советская, д. 23",phone:"8 (496) 662-54-81",email:"zaraisk.mo@sudrf.ru",
    officialUrl:'http://zaraisk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://zaraisk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"ivanteevka-city-court",name:"Ивантеевский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141281, Московская обл., г. Ивантеевка, ул. Хлебозаводская, д. 22",phone:"8 (496) 536-08-63",email:"ivanteevka.mo@sudrf.ru",
    officialUrl:'http://ivanteevka.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://ivanteevka.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"istra-city-court",name:"Истринский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143500, Московская обл., г. Истра, ул. Советская, д. 11",phone:"8 (495) 994-57-65",email:"istra.mo@sudrf.ru",
    officialUrl:'http://istra.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://istra.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"kashira-city-court",name:"Каширский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142900, Московская обл., г. Кашира, ул. Советская, д. 13",phone:"8 (496) 693-11-11",email:"kashira.mo@sudrf.ru",
    officialUrl:'http://kashira.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://kashira.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"klin-city-court",name:"Клинский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141600, Московская обл., г. Клин, ул. Ленина, д. 17",phone:"8 (496) 242-47-91",email:"klin.mo@sudrf.ru",
    officialUrl:'http://klin.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://klin.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"krasnogorsk-city-court",name:"Красногорский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143403, Московская обл., г. Красногорск, ул. Первомайская, д. 6; ул. Речная, д. 20, корп. 1",phone:"8 (495) 562-52-94",email:"krasnogorsk.mo@sudrf.ru",
    officialUrl:'http://krasnogorsk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://krasnogorsk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"lobnya-city-court",name:"Лобненский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141732, Московская обл., г. Лобня, ул. Мирная, д. 15",phone:"8 (495) 577-10-23",email:"lobnia.mo@sudrf.ru",
    officialUrl:'http://lobnia.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://lobnia.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"lukhovitsy-district-court",name:"Луховицкий районный суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140500, Московская обл., г. Луховицы, ул. Гагарина, д. 10",phone:"8 (496) 632-40-83",email:"luhovitsy.mo@sudrf.ru",
    officialUrl:'http://luhovitsy.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://luhovitsy.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"lyubertsy-city-court",name:"Люберецкий городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140005, Московская обл., г. Люберцы, ул. Калараш, д. 19",phone:"8 (498) 642-99-91",email:"luberetzy.mo@sudrf.ru",
    officialUrl:'http://luberetzy.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://luberetzy.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"mozhaysk-city-court",name:"Можайский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143200, Московская обл., г. Можайск, ул. Герцена, д. 9",phone:"8 (496) 382-59-52",email:"mojaisk.mo@sudrf.ru",
    officialUrl:'http://mojaisk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://mojaisk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"mytishchi-city-court",name:"Мытищинский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141009, Московская обл., г. Мытищи, ул. Колонцова, д. 15",phone:"8 (495) 586-24-44",email:"mitishy.mo@sudrf.ru",
    officialUrl:'http://mitishy.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://mitishy.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"naro-fominsk-city-court",name:"Наро-Фоминский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143300, Московская обл., г. Наро-Фоминск, ул. Полубоярова, стр. 8, этажи 4 и 5",phone:"8 (496) 343-56-11",email:"naro-fominsk.mo@sudrf.ru",
    officialUrl:'http://naro-fominsk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://naro-fominsk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"noginsk-city-court",name:"Ногинский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142412, Московская обл., г. Ногинск, ул. Климова, д. 53",phone:"8 (496) 511-94-68",email:"noginsk.mo@sudrf.ru",
    officialUrl:'http://noginsk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://noginsk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"odintsovo-city-court",name:"Одинцовский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143007, Московская обл., г. Одинцово, ул. Советская, д. 7; г. Звенигород, ул. Почтовая, д. 51",phone:"8 (495) 590-74-76",email:"odintsovo.mo@sudrf.ru",
    officialUrl:'http://odintsovo.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://odintsovo.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"ozyory-city-court",name:"Озерский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140560, Московская обл., г. Озеры, пл. Коммунистическая, д. 15",phone:"8 (496) 702-11-42",email:"ozery.mo@sudrf.ru",
    officialUrl:'http://ozery.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://ozery.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"orekhovo-zuyevo-city-court",name:"Орехово-Зуевский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142600, Московская обл., г. Орехово-Зуево, пл. Октябрьская, д. 2",phone:"8 (496) 412-02-28",email:"orehovo-zuevo.mo@sudrf.ru",
    officialUrl:'http://orehovo-zuevo.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://orehovo-zuevo.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"pavlovsky-posad-city-court",name:"Павлово-Посадский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142500, Московская обл., г. Павловский Посад, ул. Павловская, д. 52",phone:"8 (496) 432-10-81",email:"pavlov-posad.mo@sudrf.ru",
    officialUrl:'http://pavlov-posad.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://pavlov-posad.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"podolsk-city-court",name:"Подольский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142100, Московская обл., г. Подольск, Революционный просп., д. 57/22; мкр. Климовск, ул. Западная, д. 3",phone:"8 (496) 769-69-21",email:"podolsky.mo@sudrf.ru",
    officialUrl:'http://podolsky.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://podolsky.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"reutov-city-court",name:"Реутовский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143962, Московская обл., г. Реутов, просп. Юбилейный, д. 56",phone:"8 (495) 791-26-61",email:"reutov.mo@sudrf.ru",
    officialUrl:'http://reutov.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://reutov.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"ruza-district-court",name:"Рузский районный суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"143100, Московская обл., г. Руза, ул. Социалистическая, д. 25",phone:"8 (496) 272-46-59",email:"ruza.mo@sudrf.ru",
    officialUrl:'http://ruza.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://ruza.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"sergiev-posad-city-court",name:"Сергиево-Посадский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141300, Московская обл., г. Сергиев Посад, просп. Красной Армии, д. 205Б",phone:"8 (496) 540-22-90",email:"sergiev-posad.mo@sudrf.ru",
    officialUrl:'http://sergiev-posad.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://sergiev-posad.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"solnechnogorsk-city-court",name:"Солнечногорский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141503, Московская обл., г. Солнечногорск, ул. Маяковского, д. 17",phone:"8 (495) 994-04-91",email:"solnechnogorsky.mo@sudrf.ru",
    officialUrl:'http://solnechnogorsk.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://solnechnogorsk.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"stupino-city-court",name:"Ступинский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"142800, Московская обл., г. Ступино, ул. Куйбышева, д. 53",phone:"8 (496) 642-04-45",email:"stupino.mo@sudrf.ru",
    officialUrl:'http://stupino.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://stupino.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"taldom-district-court",name:"Талдомский районный суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"141900, Московская обл., г. Талдом, ул. Красноармейская, д. 3",phone:"8 (496) 206-03-34",email:"taldom.mo@sudrf.ru",
    officialUrl:'http://taldom.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://taldom.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"shatura-city-court",name:"Шатурский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"140700, Московская обл., г. Шатура, пл. Ленина, д. 3",phone:"8 (496) 452-15-29",email:"shatura.mo@sudrf.ru",
    officialUrl:'http://shatura.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://shatura.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
  },
  {
    slug:"elektrostal-city-court",name:"Электростальский городской суд Московской области",
    kind:"general-district",region:'region-50',regionName:'Московская область',
    address:"144010, Московская обл., г. Электросталь, ул. Журавлёва, д. 11, корп. 4",phone:"8 (496) 571-91-28",email:"elektrostal.mo@sudrf.ru",
    officialUrl:'http://elektrostal.mo.sudrf.ru/',sourceUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud',
    casesUrl:'http://elektrostal.mo.sudrf.ru/',judgesUrl:null,
    observedOn:'2026-11-09',
    competence:'Суд общей юрисдикции. Компетенцию и территориальную подсудность конкретного дела необходимо проверять по действующим процессуальным правилам.'
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
