// Source-based dossier model. Every person and operational fact requires a specific
// original official publication; no inferred coordinates, bank details or case numbers.
export type OfficialFact = {value:string;source:string;published?:string;note?:string};
export type CourtPerson = {name:string;role:string;appointment?:string;source:string};
export type CourtDossierData = {
 slug:string; region:string; name:string;kind:string;
 officialUrl:string; observedOn:string;
 judgesPublished?:string; contactsPublished?:string;
 addresses:OfficialFact[]; phones:OfficialFact[]; emails:OfficialFact[];
 judges:CourtPerson[]; staff:CourtPerson[];
 serviceLinks:{label:string;url:string;note?:string}[];
 magistrateUnits:{number:string;url:string}[];
 notes:{section:string;message:string;source:string}[];
};

const site='https://pushkino--mo.sudrf.ru/';
const contacts=site+'modules.php?id=1&name=information';
const composition=site+'modules.php?name=info_court&rid=1';
const magistrates=site+'modules.php?name=info_court&rid=4';
const judgeRows:ReadonlyArray<readonly [string,string,string]>=[
 ['Базылева Татьяна Анатольевна','Председатель суда, гражданские дела','№ 981 от 14.11.2024'],
 ['Абрамова Жанна Игоревна','Судья, гражданские дела','№ 1697 от 29.12.2011'],
 ['Баженова Екатерина Алексеевна','Судья, гражданские дела','№ 244 от 17.04.2025'],
 ['Бляблина Наталья Николаевна','Судья, гражданские дела','№ 696 от 08.12.2021'],
 ['Вдовин Владимир Александрович','Судья, уголовные дела','№ 565 от 16.08.2025'],
 ['Гнездилова Татьяна Геннадьевна','Судья, уголовные дела','№ 93 от 21.02.2025'],
 ['Дорофеев Алексей Викторович','Судья, уголовные дела','№ 829 от 08.11.2023'],
 ['Жохова Марина Геннадьевна','Судья, уголовные дела','№ 2432 от 30.06.2020'],
 ['Жукова Оксана Александровна','Судья, уголовные дела','№ 290 от 01.03.2008'],
 ['Ковалева Ольга Александровна','Судья, гражданские дела','№ 981 от 14.11.2024'],
 ['Крылов Владимир Андреевич','Судья, гражданские дела','№ 840 от 14.11.2025'],
 ['Малюкова Татьяна Сергеевна','Судья, гражданские дела','№ 138 от 03.04.2018'],
 ['Патрин Олег Владимирович','Судья, уголовные дела','№ 279 от 22.04.2020'],
 ['Солнцева Марина Сергеевна','Судья, гражданские дела','№ 324 от 10.05.2024'],
 ['Овчинникова Анастасия Алексеевна','Судья, гражданские дела','№ 324 от 10.05.2024'],
 ['Федорова Анна Викторовна','Судья, гражданские дела','№ 450 от 14.07.2022'],
 ['Цыганова Светлана Эдуардовна','Судья, гражданские дела','№ 685 от 13.08.2024']
];
export const pushkinskyCourt:CourtDossierData={
 slug:'pushkinsky-gorodskoy',
 region:'region-50',
 name:'Пушкинский городской суд Московской области',
 kind:'Городской суд общей юрисдикции',
 officialUrl:site,
 observedOn:'22.10.2026',
 judgesPublished:'02.07.2026',contactsPublished:'24.07.2026',
 addresses:[
  {value:'141240, Московская область, г. Пушкино, мкр. Мамонтовка, ул. Ленточка, д. 20а',source:site,note:'Один из двух адресов в официальном справочнике; уточняйте, в каком корпусе нужное подразделение'},
  {value:'141207, Московская область, г. Пушкино, ул. Оранжерейная, д. 21',source:site,note:'Второй адрес в официальном справочнике'}
 ],
 phones:[
  {value:'8 (496) 533-22-71',source:contacts,note:'Общественная приёмная, в официальном справочнике сотрудников'},
  {value:'8 (496) 533-22-73',source:contacts,note:'Отдел обеспечения гражданского судопроизводства'},
  {value:'8 (496) 539-04-73',source:contacts,note:'Отдел обеспечения уголовного судопроизводства'},
  {value:'8 (496) 533-22-76',source:contacts,note:'Архив'},
  {value:'8 (496) 533-22-77',source:contacts,note:'Видеоконференц-связь'}
 ],
 emails:[{value:'pushkino.mo@sudrf.ru',source:site,note:'Не является каналом процессуальной электронной подачи'}],
 judges:judgeRows.map(([name,role,appointment])=>({name,role,appointment:'Указ Президента РФ '+appointment,source:composition})),
 staff:[
  {name:'Дыда Анна Юрьевна',role:'Начальник отдела гражданского судопроизводства',source:contacts},
  {name:'Амонова Светлана Александровна',role:'Начальник отдела уголовного судопроизводства',source:contacts},
  {name:'Ковылина Елена Александровна',role:'Начальник отдела делопроизводства',source:contacts},
  {name:'Самойлова Александра Сергеевна',role:'Начальник общего отдела',source:contacts},
  {name:'Сидорова Светлана Дмитриевна',role:'Архив, секретарь суда',source:contacts},
  {name:'Ячменева Анастасия Александровна',role:'Пресс-служба',source:contacts}
 ],
 serviceLinks:[
  {label:'Официальный сайт',url:site},
  {label:'Судебное делопроизводство и поиск дела',url:site+'modules.php?name=sud_delo',note:'На момент исследования официальный раздел временно сообщает о недоступности данных'},
  {label:'Подача процессуальных документов',url:'https://ej.sudrf.ru/',note:'Авторизация и требования к процессуальному обращению — по правилам официальной системы'},
  {label:'Территориальная подсудность',url:site+'modules.php?name=terr',note:'Официальная страница сообщает об актуализации данных. Не делать точный подбор по адресу без документов о границах'},
  {label:'Состав суда',url:composition,note:'Опубликованный состав изменён 02.07.2026; текущий статус каждого назначения требует повторной сверки'},
  {label:'Телефонный справочник и аппарат',url:contacts,note:'Официальная публикация изменена 24.07.2026'},
  {label:'Реквизиты и калькулятор госпошлины',url:site+'modules.php?name=govduty'},
  {label:'Судебные участки мировых судей',url:magistrates},
  {label:'Сведения об обжаловании и правилах',url:site+'modules.php?name=information'}
 ],
 magistrateUnits:['200','201','202','203','204','205','206','207','311'].map(number=>({number,url:magistrates})),
 notes:[
  {section:'Режим работы и приём',message:'График отдельных отделов и режим выдачи документов уточняется на официальном сайте. Исторический график стороннего справочника не считается актуальным.',source:site},
  {section:'Судебные дела и заседания',message:'Список дел, залов и назначенных заседаний не сформирован: официальный раздел делопроизводства возвращает сообщение о временной недоступности. Используйте официальный поиск, когда он восстановится.',source:site+'modules.php?name=sud_delo'},
  {section:'Подсудность по точному адресу',message:'Официальный раздел территориальной подсудности находится в актуализации. Нельзя приписывать улицы и дома без проверенных первичных документов.',source:site+'modules.php?name=terr'},
  {section:'Госпошлина и депозит',message:'Банковские реквизиты и суммы не копируются без подтверждения действующей редакции; открывайте официальный калькулятор и раздел реквизитов.',source:site+'modules.php?name=govduty'},
  {section:'Карта, доступность и проезд',message:'Два адреса относятся к одному суду. Уточните нужное здание и вход до поездки. Проверенных координат входов и доступности помещений пока нет.',source:site}
 ]
};
