import Link from 'next/link';
import {Suspense} from 'react';
import type {ResearchCourt} from '../lib/research-courts';
import {pilotPublicRecord} from '../lib/pilot-public';
import researchHours from '../lib/research-hours.json';
import {ResearchDossier} from './research-dossier';
import departmentSources from '../lib/pilot-department-contacts.json';
import {YandexCourtMap} from './yandex-court-map';
import {CourtTodayHearings} from './court-today-hearings';
import {CourtPracticalGuide} from './court-practical-guide';

type Schedule={office_hours:string;source_url:string;research_checked_on:string;current_verified:boolean;note:string};
const hoursByCode=researchHours as Record<string,Schedule>;
const categories:Record<string,{name:string,scope:string}>={
 RS:{name:'Районный суд общей юрисдикции',scope:'Рассмотрение дел первой инстанции и иных вопросов, отнесённых федеральным законом к компетенции районных судов. Точные улицы и дома следует проверять в официальном реестре подсудности.'},
 OS:{name:'Суд субъекта Российской Федерации',scope:'Суд регионального уровня. Рассматривает определённые законом категории дел по первой инстанции, а также жалобы в пределах установленной процессуальной компетенции.'},
 AJ:{name:'Апелляционный суд общей юрисдикции',scope:'Апелляционная проверка соответствующих судебных актов в пределах установленного законом апелляционного округа, не автоматическая подсудность всех адресов региона.'},
 GV:{name:'Гарнизонный военный суд',scope:'Подведомственные военным судам категории дел. Префикс кода не определяет территориальную компетенцию военного суда.'},
 KV:{name:'Кассационный военный суд',scope:'Кассационная проверка судебных актов по делам, отнесённым федеральным законом к ведению военных судов. Это не районный суд для подачи первичного иска.'}
};

function safeOfficialSource(raw:string):string|null {
 try{
  const url=new URL(raw);
  const host=url.hostname.toLowerCase();
  return url.protocol==='https:' && !url.username && !url.password &&
    url.port==='' && (host==='sudrf.ru'||host.endsWith('.sudrf.ru'))?url.href:null;
 }catch{return null;}
}

export function PilotCourtPublic({court}:{court:ResearchCourt}){
 const record=pilotPublicRecord(court.code);
 if(!record)return null;
 const region='/courts/'+court.region;
 const kind=categories[court.code.slice(2,4)];
 const hours=hoursByCode[court.code];
 const department=(departmentSources as Record<string,{source_url:string;source_stated_updated:string|null;departments:{label:string;phone:string}[]}>)[court.code];
 const individual=safeOfficialSource(record.individual_source_url);
 const site=safeOfficialSource(record.https_site_url);
 const listing=safeOfficialSource(record.source_listing_url);
 const caseEvidence=record.uid_case_evidence_url?safeOfficialSource(record.uid_case_evidence_url):null;
 return <>
  <div className="breadcrumb">
   <Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link>
   <span>/</span><Link href={region}>{court.regionName}</Link>
   <span>/</span>{record.official_header_court_name}
  </div>
  <section className="section-hero">
   <span className="kicker">Публичная справочная карточка · сведения из официальных публикаций</span>
   <h1>{record.official_header_court_name}</h1>
   <p className="lead">{kind?.name??court.kind} · {court.regionName}</p>
   <div className="notice" role="note"><span className="notice-dot" aria-hidden="true"/>
    Карточка опубликована на основании открытых официальных источников.
    Дата исследования: {record.source_date_confirmed??'15.10.2026'}.
    Официальные страницы могли измениться после получения доступной веб-копии.
    Контактные сведения проверяйте непосредственно перед обращением.
    Неподтверждённые полномочия судей, границы подсудности и платёжные реквизиты не публикуются как актуальные.
   </div>
  </section>
  <nav className="court-toc" aria-label="Содержание карточки">
   <strong>Разделы</strong>
   <a href="#pilot-identity">Идентификация</a>
   <a href="#pilot-contacts">Контакты</a>
   <a href="#pilot-map">Карта и проезд</a>
   <a href="#pilot-today">Заседания сегодня</a>
   <a href="#pilot-case-search">Поиск дела</a>
   <a href="#pilot-practical">Порядок обращения</a>
   <a href="#pilot-fees">Пошлина</a>
   <a href="#pilot-competence">Подсудность</a>
   <a href="#pilot-services">Электронные сервисы</a>
   <a href="#pilot-judges">Руководство</a>
   <a href="#pilot-sources">Источники</a>
  </nav>
  <section className="court-section" id="pilot-identity">
   <span className="eyebrow">Идентификация</span>
   <h2>Вид суда, код и регион</h2>
   <dl className="court-facts">
    <div><dt>Наименование в заголовке официального сайта</dt><dd>{record.official_header_court_name}</dd></div>
    <div><dt>Категория</dt><dd>{kind?.name??court.kind}</dd></div>
    <div><dt>Регион местонахождения</dt><dd>{court.regionName}</dd></div>
    <div><dt>Код из официального перечня</dt><dd>{court.code}</dd></div>
    <div><dt>Доказательство кода в опубликованной карточке дела</dt><dd>
     {caseEvidence?<a href={caseEvidence} target="_blank" rel="noopener noreferrer">Открыть пример официальной записи ↗</a>
      :'Отдельное подтверждение по UID дела пока не получено'}</dd></div>
   </dl>
   {!record.archived_name_matches_official_header?<p className="court-source">
    В старом региональном экспорте название дополнено указанием области:
    {' '}{record.court_name}. Для публичного заголовка использовано наименование с персонального сайта.
   </p>:null}
  </section>
  <section className="court-section" id="pilot-contacts">
   <span className="eyebrow">Справочные контакты</span>
   <h2>Адрес, телефон и электронная почта</h2>
   <dl className="court-facts">
    <div><dt>Основной адрес из официальной публикации</dt><dd>{record.archived_values.address}</dd></div>
    <div><dt>Телефон(ы) из опубликованного справочника</dt><dd>{record.archived_values.phone}</dd></div>
    <div><dt>Официальный e-mail</dt><dd>{record.archived_values.email}</dd></div>
    <div><dt>Персональный сайт</dt><dd>{site?<a href={site} target="_blank" rel="noopener noreferrer">Перейти на сайт суда ↗</a>:'Проверьте ссылку'}</dd></div>
   </dl>
   <p className="court-source">Это справочные значения из официальной публикации, а не гарантия работы каждого телефонного номера или приёма процессуальных документов по e-mail.</p>
   {hours?<div className="notice" role="note">
    <strong>Опубликованный общий график:</strong> {hours.office_hours}.
    <a href={hours.source_url} target="_blank" rel="noopener noreferrer"> Сверить расписание ↗</a>
    <p className="court-source">График приёма отдельных подразделений может отличаться.</p>
   </div>:<p>Общий график работы не подтверждён отдельным источником для данной карточки; уточняйте его на официальном сайте суда.</p>}
  </section>
  <YandexCourtMap code={court.code} name={record.official_header_court_name} address={record.archived_values.address}/>
  {department?<section className="court-section" id="pilot-departments">
   <span className="eyebrow">Контакты специализированных отделов</span>
   <h2>Телефоны подразделений по официальному справочнику</h2>
   <div className="court-department-grid">
    {department.departments.map(item=><article key={item.label}>
     <h3>{item.label}</h3><p className="court-phone">{item.phone}</p>
     <p className="court-source"><a href={department.source_url} target="_blank" rel="noopener noreferrer">Официальная контактная страница ↗</a></p>
    </article>)}
   </div>
   <p className="court-source">
    {department.source_stated_updated?'Дата изменения официальной публикации: '+department.source_stated_updated+'. ':''}
    Назначение номера и доступность линии следует уточнить на сайте суда перед обращением.
   </p>
  </section>:null}
  <section className="court-section" id="pilot-competence">
   <span className="eyebrow">Территориальная и инстанционная подсудность</span>
   <h2>Какие дела рассматривает суд</h2>
   <p>{kind?.scope??'Компетенция суда определяется процессуальным законодательством Российской Федерации.'}</p>
   <p>Уличная и домовая подсудность, специальные правила и исключения требуют проверки по актуальному официальному перечню.
    Карточка не определяет конкретный суд только по адресу заявителя.</p>
   {record.specific_blockers.length>0?<ul>{record.specific_blockers.map(note=><li key={note}>{note}</li>)}</ul>:null}
   {site?<p><a href={site} target="_blank" rel="noopener noreferrer">Открыть официальный раздел «Территориальная подсудность» на сайте суда ↗</a></p>:null}
  </section>
  <Suspense fallback={<section className="court-section" id="pilot-today"><h2>Заседания сегодня</h2><p>Запрашиваем публикацию за сегодняшний день у суда…</p></section>}>
    <CourtTodayHearings code={court.code}/>
  </Suspense>
  <CourtPracticalGuide courtType={court.code.slice(2,4)}/>
  <ResearchDossier code={court.code}/>
  <section className="court-section" id="pilot-judges">
   <span className="eyebrow">Кадровая информация</span>
   <h2>Судьи и руководство</h2>
   <p>Список судей и назначения публикуются только при подтверждении действующих полномочий по официальным актам.
     Исследовательские сведения, если они приведены выше, не являются актуальным кадровым реестром.</p>
   {site?<a href={site} target="_blank" rel="noopener noreferrer">Проверить руководство и состав на сайте суда ↗</a>:null}
  </section>
  <section className="court-section" id="pilot-sources">
   <span className="eyebrow">Прозрачность публикации</span>
   <h2>Источники, дата и ограничения</h2>
   <p>В основе карточки лежит официальный реестр и отдельный персональный сайт суда.
    Информация извлечена из доступных веб-публикаций; она не является официальным юридическим заключением,
    а редакционная актуальность на дату посещения карточки не гарантируется.</p>
   <ul>
    {individual?<li><a href={individual} target="_blank" rel="noopener noreferrer">Персональная официальная публикация ↗</a></li>:null}
    {listing?<li><a href={listing} target="_blank" rel="noopener noreferrer">Исходный реестр ГАС «Правосудие» ↗</a></li>:null}
    {site?<li><a href={site} target="_blank" rel="noopener noreferrer">Официальный сайт суда ↗</a></li>:null}
   </ul>
   <p className="court-source">Дата исследования: 15 октября 2026 года. Следующая проверка фактической актуальности необходима.
    Полная редакционная аттестация отсутствует; ранее сохранённые исследовательские записи Neon остаются отдельно от подтверждённого реестра.
   </p>
  </section>
  <section className="callout">
   <div><h2>Другие суды</h2><p>Перейдите к списку судов региона или поиску по России.</p></div>
   <div className="callout-links"><Link href={region}>Суды региона →</Link><Link href="/courts">Каталог России →</Link></div>
  </section>
 </>;
}
