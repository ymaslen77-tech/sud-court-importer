'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {MoscowRegionCase,MoscowRegionCode,MoscowRegionCourtOption} from '../lib/moscow-region-case-index';
import {matchesSourceBoundMoscowCase} from '../lib/moscow-region-case-search';

type Props={cases:ReadonlyArray<MoscowRegionCase>;courts:ReadonlyArray<MoscowRegionCourtOption>;
 initialQuery:string;initialRegion:''|MoscowRegionCode;initialCourt:string};
const norm=(s:string)=>s.toLocaleLowerCase('ru').replace(/ё/g,'е')
 .replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,' ').trim();
const regionLabel=(r:MoscowRegionCode)=>r==='moscow'?'Москва':'Московская область';

export function MoscowRegionCaseExplorer({cases,courts,initialQuery,initialRegion,initialCourt}:Props){
 const [query,setQuery]=useState(initialQuery);
 const [region,setRegion]=useState<''|MoscowRegionCode>(initialRegion);
 const [court,setCourt]=useState(initialCourt);
 const [status,setStatus]=useState('');
 const [category,setCategory]=useState('');
 const localCourts=useMemo(()=>courts.filter(c=>!region||c.region===region),[courts,region]);
 const localCases=useMemo(()=>cases.filter(c=>(!region||c.region===region)
   &&(!court||c.region+':'+c.courtSlug===court)
   &&(!status||c.dispositionScope===status)
   &&(!category||c.category===category)
   &&matchesSourceBoundMoscowCase(c,query)),
 [cases,region,court,status,category,query]);
 const categories=useMemo(()=>[...new Set(cases.filter(c=>!region||c.region===region)
  .map(c=>c.category))].sort((a,b)=>a.localeCompare(b,'ru')),[cases,region]);
 const shown=[...localCases].sort((a,b)=>
   (b.recordDate??b.observationDate).localeCompare(a.recordDate??a.observationDate)
    ||a.number.localeCompare(b.number,'ru'));
 const active=Boolean(query.trim()||region||court||status||category);
 const selectedCourt=localCourts.find(c=>c.region+':'+c.slug===court);
 const courtMatches=norm(query).length>=2?localCourts.filter(c=>
  norm(c.name).includes(norm(query))||norm(query).includes(norm(c.name))).slice(0,8):[];
 const officialPortal=region==='region-50'
   ?'https://oblsud--mo.sudrf.ru/modules.php?name=sud_delo'
   :'https://mos-gorsud.ru/search';
 return <section className="court-section" aria-label="Поиск судебных дел двух регионов">
  <h2>Поиск в проверяемой подборке</h2>
  <p>Можно искать по номеру первой инстанции, подтверждённому номеру апелляционного дела, номеру жалобы, названию суда и категории дела. Это локальные записи из официальных источников, <strong>не полный реестр</strong>. При отсутствии совпадения проверьте официальный сайт суда.</p>
  <div className="moscow-judge-controls">
   <label>Номер дела или категория
    <input type="search" maxLength={100} value={query} onChange={e=>setQuery(e.target.value)}
     placeholder="Например, Ж-65034/2026, 33-53951/2026 или жилищный спор"/>
   </label>
   <label>Регион
    <select value={region} onChange={e=>{setRegion(e.target.value as ''|MoscowRegionCode);setCourt('');setCategory('');}}>
     <option value="">Москва и Московская область</option>
     <option value="moscow">Москва</option>
     <option value="region-50">Московская область</option>
    </select>
   </label>
   <label>Суд
    <select value={court} onChange={e=>setCourt(e.target.value)}>
     <option value="">Все суды выбранного региона</option>
     {localCourts.map(c=><option key={c.region+':'+c.slug} value={c.region+':'+c.slug}>{c.name}</option>)}
    </select>
   </label>
   <label>Категория
    <select value={category} onChange={e=>setCategory(e.target.value)}>
     <option value="">Все категории нашей подборки</option>
     {categories.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
   </label>
   <label>Уровень подтверждения результата
    <select value={status} onChange={e=>setStatus(e.target.value)}>
     <option value="">Все записи</option>
     <option value="first_instance_registry">Результат первой инстанции указан в реестре</option>
     <option value="not_verified">Результат не подтверждён</option>
    </select>
   </label>
  </div>
  {active?<div className="court-filter-actions"><button type="button" className="button button-outline" onClick={()=>{
   setQuery('');setRegion('');setCourt('');setStatus('');setCategory('');
  }}>Очистить фильтры</button></div>:null}
  <p role="status" aria-live="polite"><strong>Найдено записей: {shown.length}</strong> из {cases.length} имеющихся в нашей подборке.
   Это не количество всех дел судов.</p>
  {selectedCourt?<div className="notice" role="note">
   <p><strong>Выбран суд:</strong> <Link href={selectedCourt.href}>{selectedCourt.name}</Link>.</p>
   <p>{selectedCourt.officialCaseSearchUrl
     ?<a href={selectedCourt.officialCaseSearchUrl} target="_blank" rel="noopener noreferrer">Открыть подтверждённую официальную форму поиска дел ↗</a>
     :<a href={selectedCourt.officialUrl} target="_blank" rel="noopener noreferrer">Перейти на официальный сайт и выбрать «Судебное делопроизводство» ↗</a>}
    {selectedCourt.officialCaseSearchUrl?'':' Прямая форма этого суда отдельно не проверена.'}</p>
   </div>:null}
  {!court&&courtMatches.length>0?<div className="court-source" role="note">
   <strong>Подходящие названия судов:</strong>{' '}
   {courtMatches.map((c,i)=><span key={c.region+':'+c.slug}>{i>0?' · ':''}
    <Link href={c.href}>{c.name}</Link></span>)}
   <p>Совпадения по названиям не определяют подсудность и не означают, что в локальной выборке есть дело.</p>
  </div>:null}
  {shown.length?<div className="results">{shown.map(c=><article className="result-row" key={c.id}>
   <div>
    <h3>Дело № {c.number}</h3>
    <p><strong>Регион:</strong> {regionLabel(c.region)}.</p>
    <p><strong>Суд:</strong> <Link href={c.courtHref}>{c.courtName}</Link>.</p>
    {c.appealNumber?<p><strong>Апелляционное дело:</strong> № {c.appealNumber}; первоначальное дело № {c.firstInstanceNumber}.</p>:null}
    {c.appealDocket?<p><strong>Регистрация апелляционного материала:</strong> № {c.appealDocket}
     {c.appealRegisteredOn?' ('+c.appealRegisteredOn+')':''}. Результат пересмотра не установлен.</p>:null}
    {c.appealHearingDate&&c.appealHearingObservedOn?<p className="court-source">
     <strong>Историческая запись о назначении:</strong> по состоянию на {c.appealHearingObservedOn}
     заседание назначалось на {c.appealHearingDate} {c.appealHearingTime??''}.
     Эта дата не является актуальным расписанием; проведение, перенос и исход не подтверждены.
    </p>:null}
    <p><strong>Категория:</strong> {c.category}.</p>
    {c.judgeName?<p><strong>Судья, названный в реестре:</strong> {c.judgeName}.</p>:null}
    <p><strong>Результат:</strong> {c.dispositionScope==='first_instance_registry'
      ?'По опубликованной записи первой инстанции: '+c.disposition+'. Результат дальнейшего пересмотра не установлен.'
      :'По данному источнику не подтверждён. Назначение заседания не означает его проведения.'}</p>
    {c.evidenceStatus==='single_official_index_snapshot'
      ?<p className="court-source">Архивный список заседаний областного суда от {c.recordDate}.
        Прямая карточка дела отдельно не прочитана. Текущее движение дела и текст акта не проверены.</p>
      :<p className="court-source">Сведения о деле из официального реестра, просмотрены {c.observationDate}.
        Мотивированный текст судебного акта не проверен.</p>}
    <div className="court-filter-actions">
      <a className="text-link" href={c.sourceUrl} target="_blank" rel="noopener noreferrer">
       {c.detailRead?'Открыть официальную карточку':'Попробовать открыть официальную карточку'} ↗
      </a>
      {c.appealSourceUrl?<a className="text-link" href={c.appealSourceUrl}
       target="_blank" rel="noopener noreferrer">Карточка апелляционного материала ↗</a>:null}
      {c.sourceIndexUrl?<a className="text-link" href={c.sourceIndexUrl}
       target="_blank" rel="noopener noreferrer">Официальный реестр областного суда ↗</a>:null}
    </div>
   </div>
  </article>)}</div>:<div className="notice" role="status">
    По выбранным условиям в нашей подборке записей нет. Это не означает отсутствия дела.
    <a href={officialPortal} target="_blank" rel="noopener noreferrer"> Открыть официальный поиск ↗</a>
   </div>}
  <p className="court-source">Список Московской области содержит исторические указатели из одного официального источника — они не удостоверяют исход апелляции и не являются пересказом судебных решений. Персональные данные сторон не публикуются.</p>
 </section>;
}
