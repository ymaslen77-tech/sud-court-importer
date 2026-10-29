/** Editorial reference dossier for Constitutional Court of Russia.
 * Source snapshot: 2026-10-27. Source links are preserved per individual.
 * Public official list currently shows 10 people; statutory capacity is 11.
 * No unsupported positions, photographs or alleged case assignments.
 */
/** Official contact facts checked against the current Russian-language contacts page
 * on 2026-10-29. The older FAQ still says Galernaya 1 for reception; that address
 * is separately confirmed as the entrance for visitors of public hearings.
 */
export const CONSTITUTIONAL_CONTACTS={
 postalAddress:'190000, Санкт-Петербург, Сенатская площадь, дом 1',
 postalMapAddress:'Санкт-Петербург, Сенатская площадь, 1',
 receptionAddress:'Санкт-Петербург, улица Галерная, дом 3',
 receptionMapAddress:'Санкт-Петербург, Галерная улица, 3',
 hearingAddress:'Санкт-Петербург, улица Галерная, дом 1',
 hearingMapAddress:'Санкт-Петербург, Галерная улица, 1',
 receptionSource:'https://www.ksrf.ru/contacts.php',
 hearingSource:'https://www.ksrf.ru/Sessions/visit.php',
 sourceCheckedAt:'2026-10-29'
} as const;

export type ConstitutionalJudge={
 id:string;name:string;position:string;appointed:string;
 background:string;focus:string;source:string;portrait?:string;portraitCredit?:string;
};
export const CONSTITUTIONAL_JUDGES:ReadonlyArray<ConstitutionalJudge>=[
 {id:'zorkin',name:'Зорькин Валерий Дмитриевич',position:'Председатель Конституционного Суда РФ',
 appointed:'Судья с 1991 года; вновь назначен председателем 25 сентября 2023 года',
 background:'Окончил юридический факультет МГУ в 1964 году. Доктор юридических наук, профессор. Впервые возглавил Конституционный Суд в 1991 году; вновь — с 2003 года.',
 focus:'Теория права, конституционное развитие и конституционное правосудие.',
 source:'https://www.ksrf.ru/about/judges/7149/',
 portrait:'https://commons.wikimedia.org/wiki/Special:FilePath/Валерий_Зорькин_(13-12-2021)_(cropped).jpg?width=350',
 portraitCredit:'Фото: Пресс-служба Президента РФ / Kremlin.ru, CC BY 4.0 (2021).'},
 {id:'zharkova',name:'Жаркова Людмила Михайловна',position:'Заместитель Председателя Конституционного Суда РФ',
 appointed:'Судья с 11 июня 1997 года; заместитель председателя с 4 июня 2025 года',
 background:'Выпускница юридического факультета ЛГУ (1979). Работала судьёй в Петрозаводске, в Министерстве юстиции Карелии и Конституционном Суде Республики Карелия.',
 focus:'Трудовое и государственное право.',source:'https://www.ksrf.ru/about/judges/7153/',
 portrait:'https://commons.wikimedia.org/wiki/Special:FilePath/Lyudmila_Zharkova_(cropped).jpg?width=350',
 portraitCredit:'Фото: Kremlin.ru, CC BY 4.0 (2017).'},
 {id:'bushev',name:'Бушев Андрей Юрьевич',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 8 июня 2022 года',
 background:'Окончил юридический факультет ЛГУ (1988). Преподавал гражданское и коммерческое право в Санкт-Петербургском университете. Кандидат юридических наук.',
 focus:'Гражданское, коммерческое право и арбитраж.',source:'https://www.ksrf.ru/about/judges/12926/'},
 {id:'kalinovsky',name:'Калиновский Константин Борисович',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 16 июля 2025 года',
 background:'Выпускник Санкт-Петербургской высшей школы МВД России (1996). Кандидат юридических наук, преподавал уголовно-процессуальное право и работал в Секретариате КС РФ.',
 focus:'Уголовный процесс и судебная защита.',source:'https://www.ksrf.ru/about/judges/37034/',
 portrait:'https://commons.wikimedia.org/wiki/Special:FilePath/Kalinovsky.jpg?width=350',
 portraitCredit:'Фото: Совет Федерации / Council.gov.ru, CC BY 4.0 (2025).'},
 {id:'knyazev',name:'Князев Сергей Дмитриевич',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 15 октября 2008 года',
 background:'Окончил Дальневосточный государственный университет (1981). Доктор юридических наук, профессор; ранее возглавлял избирательную комиссию Приморского края.',
 focus:'Конституционное, административное и избирательное право.',source:'https://www.ksrf.ru/about/judges/7166/'},
 {id:'kokotov',name:'Кокотов Александр Николаевич',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 3 марта 2010 года',
 background:'Выпускник Свердловского юридического института (1985). Доктор юридических наук, профессор; преподавал и возглавлял кафедру конституционного права.',
 focus:'Конституционное право и организация публичной власти.',source:'https://www.ksrf.ru/about/judges/7175/'},
 {id:'konovalov',name:'Коновалов Александр Владимирович',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 16 апреля 2025 года',
 background:'Окончил Санкт-Петербургский государственный университет. Работал в органах прокуратуры; министр юстиции РФ в 2008–2020 годах.',
 focus:'Государственно-правовые вопросы и юридическая система.',source:'https://www.ksrf.ru/about/judges/32925/',
 portrait:'https://commons.wikimedia.org/wiki/Special:FilePath/Коновалов_2025.jpg?width=350',
 portraitCredit:'Фото: Совет Федерации / Council.gov.ru, CC BY 4.0 (2025).'},
 {id:'lobov',name:'Лобов Михаил Борисович',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 25 сентября 2023 года',
 background:'Выпускник МГИМО (1992); обучался в Страсбургском и Колумбийском университетах. Работал по вопросам защиты прав человека и международного права.',
 focus:'Международное право и судебная защита прав человека.',source:'https://www.ksrf.ru/about/judges/14912/',
 portrait:'https://commons.wikimedia.org/wiki/Special:FilePath/Mikhail_Lobov_(cropped).jpg?width=350',
 portraitCredit:'Фото: Совет Федерации / Council.gov.ru, CC BY 4.0 (2023).'},
 {id:'sivitsky',name:'Сивицкий Владимир Александрович',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 21 июня 2023 года',
 background:'Выпускник юридического факультета МГУ. Кандидат юридических наук; работал в Секретариате КС РФ, в том числе руководителем с 2015 года.',
 focus:'Конституционное право, законодательство и местное самоуправление.',source:'https://www.ksrf.ru/about/judges/14751/'},
 {id:'taribo',name:'Тарибо Евгений Васильевич',position:'Судья Конституционного Суда РФ',
 appointed:'Назначен 16 июля 2025 года',
 background:'Выпускник Уральской государственной юридической академии. Доктор юридических наук, профессор; ранее возглавлял Секретариат КС РФ (с 2023 года).',
 focus:'Конституционное, налоговое и административное право.',source:'https://www.ksrf.ru/about/judges/37035/',
 portrait:'https://commons.wikimedia.org/wiki/Special:FilePath/Taribo.jpg?width=350',
 portraitCredit:'Фото: Совет Федерации / Council.gov.ru, CC BY 4.0 (2025).'}
];
export const CONSTITUTIONAL_SOURCES=[
 {label:'Действующий состав судей',url:'https://www.ksrf.ru/about/judges/'},
 {label:'Полномочия по статье 3 ФКЗ № 1-ФКЗ',url:'https://ksrf.ru/about/legalbases/FCLM/Article3.php'},
 {label:'Численность по статье 4 ФКЗ № 1-ФКЗ',url:'https://www.ksrf.ru/about/legalbases/FCLM/Article4.php'},
 {label:'Приём граждан и порядок обращения',url:'https://www.ksrf.ru/Petition/CommonComplaintQ.php'},
 {label:'Требования к жалобам и госпошлина',url:'https://www.ksrf.ru/Petition/'},
 {label:'Реквизиты госпошлины',url:'https://www.ksrf.ru/Petition/Requisites.php'},
 {label:'История Суда',url:'https://www.ksrf.ru/about/History/'},
 {label:'Структура аппарата',url:'https://www.ksrf.ru/about/apparat/'},
 {label:'Секретариат Суда',url:'https://www.ksrf.ru/about/apparat/sekretariat.php'},
];
export const CONSTITUTIONAL_SECRETARIAT=[
 {section:'Руководитель Секретариата',person:'Байгозин Константин Игоревич',scope:'Обеспечение деятельности Секретариата.'},
 {section:'Конституционные основы публичного права',person:'Козленко Михаил Сергеевич',scope:'Государственное устройство, публичная власть, выборы, налоги и административное право.'},
 {section:'Конституционные основы частного права',person:'Рыбалов Андрей Олегович',scope:'Гражданские, семейные, жилищные, имущественные и арбитражные вопросы.'},
 {section:'Трудовое законодательство и социальная защита',person:'Коробченко Виктория Валерьевна',scope:'Трудовые, пенсионные, социальные права.'},
 {section:'Конституционные основы уголовной юстиции',person:'Вагин Олег Александрович',scope:'Уголовное, уголовно-процессуальное и уголовно-исполнительное законодательство.'},
 {section:'Редакционно-издательское управление',person:'Сергеева Наталья Адольфовна',scope:'Подготовка текстов решений и официальных материалов.'},
 {section:'Отдел судебных заседаний',person:'Арановская Инна Валентиновна',scope:'Организация заседаний и изготовление протоколов.'},
 {section:'Отдел анализа судебной практики',person:'Карицкая Анастасия Андреевна',scope:'Обобщение практики и мониторинг исполнения решений.'},
 {section:'Отдел приёма граждан',person:'Малинина Алла Олеговна',scope:'Разъяснение порядка обращения и приём корреспонденции.'},
 {section:'Отдел делопроизводства',person:'Зиновьева Елена Сергеевна',scope:'Регистрация, движение дел и архив.'},
];
