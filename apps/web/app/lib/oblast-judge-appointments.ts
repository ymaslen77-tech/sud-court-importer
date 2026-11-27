/** Appointment events, not a live roster. Three reproductions of each decree are
 * cross-checked; reproductions of one act are not independent appointment evidence.
 * Official publication 723 link was located, but timed out during retrieval.
 */
export type OblastAppointment={courtSlug:string;name:string;role:string;date:string;decree:string;sourceUrls:readonly string[];officialPublicationUrl?:string;currentStatusVerified:false};
const groups=[
 {date:'2026-10-12',decree:'723',officialPublicationUrl:'https://publication.pravo.gov.ru/document/View/0001202610120009',sourceUrls:['https://pravo.ru/arbitr_practice/order/100157/','https://apkrfkod.ru/zakonodatelstvo/ukaz-prezidenta-rf-ot-12102026-n-723/','https://npalib.ru/2026/10/12/ukaz-723-id630543/'],rows:[
  [
    "balashikha-city-court",
    "Евстратова Виктория Игоревна",
    "судья"
  ],
  [
    "lobnya-city-court",
    "Соловьева Виктория Алексеевна",
    "судья"
  ],
  [
    "mytishchi-city-court",
    "Дубровин Дмитрий Евгеньевич",
    "судья"
  ],
  [
    "naro-fominsk-city-court",
    "Магомедов Мурад Магомедович",
    "судья"
  ],
  [
    "noginsk-city-court",
    "Сергеева Наталья Валерьевна",
    "судья"
  ],
  [
    "odintsovo-city-court",
    "Князьков Евгений Игоревич",
    "судья"
  ],
  [
    "odintsovo-city-court",
    "Макеева Мария Дмитриевна",
    "судья"
  ],
  [
    "odintsovo-city-court",
    "Минаева Олеся Сергеевна",
    "судья"
  ],
  [
    "odintsovo-city-court",
    "Мякенко Дмитрий Борисович",
    "судья"
  ],
  [
    "podolsk-city-court",
    "Окорков Александр Евгениевич",
    "судья"
  ],
  [
    "podolsk-city-court",
    "Шитова Алёна Олеговна",
    "судья"
  ],
  [
    "serpukhov-city-court",
    "Янкина Наталья Владимировна",
    "судья"
  ],
  [
    "solnechnogorsk-city-court",
    "Никитина Маргарита Федоровна",
    "судья"
  ],
  [
    "taldom-district-court",
    "Титова Мария Сергеевна",
    "судья"
  ],
  [
    "shatura-city-court",
    "Полоскова Елена Евгеньевна",
    "судья"
  ],
  [
    "shelkovo-city-court",
    "Баркова Елена Юрьевна",
    "судья"
  ],
  [
    "ivanteevka-city-court",
    "Хапаева Светлана Борисовна",
    "председатель суда"
  ],
  [
    "lyubertsy-city-court",
    "Фирсова Татьяна Сергеевна",
    "заместитель председателя суда"
  ],
  [
    "solnechnogorsk-city-court",
    "Карасева Екатерина Николаевна",
    "председатель суда"
  ],
  [
    "lobnya-city-court",
    "Егорова Надежда Львовна",
    "председатель суда"
  ]
]},
 {date:'2026-07-27',decree:'514',sourceUrls:['https://pravo.ru/arbitr_practice/order/100154/','https://apkrfkod.ru/zakonodatelstvo/ukaz-prezidenta-rf-ot-27072026-n-514/','https://lawnotes.ru/president-rf/ukaz-prezidenta-rf-ot-27.07.2026-n-514'],rows:[
  [
    "sergiev-posad-city-court",
    "Казарова Татьяна Владимировна",
    "председатель суда"
  ],
  [
    "chekhov-city-court",
    "Трощило Артур Евгеньевич",
    "председатель суда"
  ],
  [
    "shelkovo-city-court",
    "Голочанова Ирина Валерьевна",
    "председатель суда"
  ],
  [
    "dmitrov-city-court",
    "Кужлева Кристина Валерьевна",
    "судья"
  ],
  [
    "lyubertsy-city-court",
    "Кочергина Ирина Геннадьевна",
    "судья"
  ],
  [
    "khimki-city-court",
    "Алексеева Ирина Викторовна",
    "судья"
  ],
  [
    "moscow-oblast-court",
    "Князева Дарья Павловна",
    "судья"
  ]
]}
];
export const OBLAST_APPOINTMENTS:readonly OblastAppointment[]=groups.flatMap(g=>g.rows.map(([courtSlug,name,role])=>({courtSlug,name,role,date:g.date,decree:g.decree,sourceUrls:g.sourceUrls,officialPublicationUrl:g.officialPublicationUrl,currentStatusVerified:false as const})));
export const oblastAppointments=(slug:string)=>OBLAST_APPOINTMENTS.filter(x=>x.courtSlug===slug);
