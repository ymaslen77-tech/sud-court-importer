/**
 * Judicial taxonomy for navigation, NOT a procedural jurisdiction decision tree.
 *
 * "Судьи" are people with appointments. These labels describe court categories,
 * not separate judicial professions or evidence of a judge's employment.
 */
export type CourtFamily = 'highest' | 'general' | 'military' | 'arbitration';
export type CourtCategory = {
  slug: string;
  title: string;
  short: string;
  family: CourtFamily;
  description: string;
  level: string;
  sourceUrl: string;
};

export const COURT_FAMILIES: {id:CourtFamily;title:string;description:string}[] = [
  {id:'highest',title:'Высшие судебные органы',description:'Конституционный Суд РФ и Верховный Суд РФ имеют самостоятельную компетенцию.'},
  {id:'general',title:'Суды общей юрисдикции',description:'Мировые судьи, районные, суды субъектов, апелляционные и кассационные суды общей юрисдикции.'},
  {id:'military',title:'Военные суды',description:'Гарнизонные, окружные (флотские), апелляционный и кассационный военные суды.'},
  {id:'arbitration',title:'Арбитражные суды',description:'Суды по экономическим спорам: суды субъектов, апелляционные, суды округов и Суд по интеллектуальным правам.'}
];

const generalLaw = 'https://sudrf.ru/index.php?act=go_search&id=300&searchtype=fs';
const magistrates = 'https://sudrf.ru/index.php?act=go_ms_search&id=300&searchtype=ms';
const arbitrationLaw = 'https://arbitr.ru/materials/ojfederal_nixjarbitrazhnixjsudax';

export const COURT_CATEGORIES: CourtCategory[] = [
  {slug:'constitutional',title:'Конституционный Суд Российской Федерации',short:'Конституционный Суд',family:'highest',description:'Разрешает вопросы конституционного судопроизводства в пределах установленной законом компетенции.',level:'Конституционный контроль',sourceUrl:'https://ksrf.ru/'},
  {slug:'supreme',title:'Верховный Суд Российской Федерации',short:'Верховный Суд',family:'highest',description:'Высший судебный орган по гражданским, уголовным, административным делам, разрешению экономических споров и иным делам, подсудным судам.',level:'Высший судебный орган',sourceUrl:'https://vsrf.ru/'},
  {slug:'general-magistrate',title:'Мировые судьи и судебные участки',short:'Мировые судьи',family:'general',description:'Мировые судьи — судьи общей юрисдикции субъектов РФ. Судебный участок — территория их деятельности, не отдельная должность.',level:'Дела, подсудные мировому судье',sourceUrl:magistrates},
  {slug:'general-district',title:'Районные, городские и межрайонные суды',short:'Районные и городские',family:'general',description:'Рассматривают дела по первой инстанции в пределах компетенции и жалобы на постановления мировых судей в установленных законом случаях.',level:'Первая инстанция и предусмотренный законом пересмотр',sourceUrl:generalLaw},
  {slug:'general-regional',title:'Верховные суды республик, краевые, областные и приравненные',short:'Областные и краевые',family:'general',description:'Суды субъектов РФ: верховные суды республик, краевые, областные, суды городов федерального значения, автономной области и округов.',level:'Суд уровня субъекта РФ',sourceUrl:generalLaw},
  {slug:'general-appeal',title:'Апелляционные суды общей юрисдикции',short:'Апелляционные суды',family:'general',description:'Рассматривают определённые категории апелляционных жалоб на судебные акты в рамках установленной инстанционной компетенции.',level:'Апелляционный пересмотр',sourceUrl:generalLaw},
  {slug:'general-cassation',title:'Кассационные суды общей юрисдикции',short:'Кассационные суды',family:'general',description:'Осуществляют кассационный пересмотр судебных актов по установленным процессуальным правилам.',level:'Кассационный пересмотр',sourceUrl:generalLaw},
  {slug:'military-garrison',title:'Гарнизонные военные суды',short:'Гарнизонные',family:'military',description:'Военные суды соответствующего уровня; рассматривают дела по установленной федеральным законом компетенции.',level:'Военный суд первой инстанции',sourceUrl:generalLaw},
  {slug:'military-district',title:'Окружные (флотские) военные суды',short:'Окружные (флотские)',family:'military',description:'Военные суды соответствующего округа или флота; компетенция определяется специальным законодательством.',level:'Военный суд окружного уровня',sourceUrl:generalLaw},
  {slug:'military-appeal',title:'Апелляционный военный суд',short:'Военная апелляция',family:'military',description:'Суд апелляционного пересмотра судебных актов военных судов по предусмотренным законом правилам.',level:'Военная апелляция',sourceUrl:generalLaw},
  {slug:'military-cassation',title:'Кассационный военный суд',short:'Военная кассация',family:'military',description:'Суд кассационного пересмотра в военной судебной системе.',level:'Военная кассация',sourceUrl:generalLaw},
  {slug:'arbitration-subject',title:'Арбитражные суды субъектов Российской Федерации',short:'Арбитражные суды субъектов',family:'arbitration',description:'Рассматривают экономические споры и другие отнесённые к их компетенции дела.',level:'Как правило, первая инстанция',sourceUrl:arbitrationLaw},
  {slug:'arbitration-appeal',title:'Арбитражные апелляционные суды',short:'Арбитражная апелляция',family:'arbitration',description:'Пересматривают судебные акты арбитражных судов субъектов в порядке апелляции.',level:'Апелляционная инстанция',sourceUrl:arbitrationLaw},
  {slug:'arbitration-district',title:'Арбитражные суды округов',short:'Арбитражная кассация',family:'arbitration',description:'Осуществляют кассационный пересмотр судебных актов арбитражных судов по правилам АПК РФ.',level:'Кассационная инстанция',sourceUrl:arbitrationLaw},
  {slug:'arbitration-ip',title:'Суд по интеллектуальным правам',short:'Интеллектуальные права',family:'arbitration',description:'Специализированный арбитражный суд с предусмотренной законом компетенцией по первой и кассационной инстанциям.',level:'Специализированный суд',sourceUrl:arbitrationLaw}
];

export const COURT_KINDS = COURT_CATEGORIES.map(x=>x.slug);
export const findCategory = (slug:string) => COURT_CATEGORIES.find(c=>c.slug===slug);
