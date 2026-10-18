'use client';
import {useMemo,useState} from 'react';
import type {MoscowCourt} from '../lib/moscow-courts';
import {MOSCOW_CASE_TOPICS} from '../lib/moscow-case-topics';
export function MoscowCasesExplorer({court}:{court:MoscowCourt}){
 const [search,setSearch]=useState('');
 const normalized=search.trim().toLocaleLowerCase('ru');
 const groups=useMemo(()=>MOSCOW_CASE_TOPICS.map(topic=>({
  ...topic,items:court.case_examples.filter(c=>c.topic_id===topic.id &&
   (!normalized||[c.number,c.subject].some(x=>x.toLocaleLowerCase('ru').includes(normalized))))
 })),[court.case_examples,normalized]);
 const total=groups.reduce((sum,t)=>sum+t.items.length,0);
 return <section id="msk-cases" className="court-section">
  <span className="eyebrow">Собственная тематическая подборка · официальные источники</span>
  <h2>Какие конкретные дела рассматривались в суде</h2>
  <p>Откройте категорию, чтобы увидеть номера и предметы реально опубликованных дел. Список не является полным реестром, не обновляется в реальном времени и не устанавливает исход разбирательств.</p>
  <label className="moscow-case-search" htmlFor={'cases-'+court.slug}>Поиск по номеру или теме среди размещённых дел
   <input id={'cases-'+court.slug} type="search" placeholder="Например, 02-9557/2026 или алименты" value={search} onChange={event=>setSearch(event.target.value)} maxLength={90}/>
  </label>
  <p className="court-source">Найдено в нашей подборке: {total}. Категории без размещённых примеров оставлены для последующего подтверждённого наполнения.</p>
  <div className="moscow-case-topics">
   {groups.map(topic=><details key={topic.id} className="moscow-case-topic" open={undefined}>
    <summary><span>{topic.title}</span><small>{topic.items.length} дел(а) в выборке</small></summary>
    <div className="moscow-case-topic-content">
     <p>{topic.description}</p><p className="court-source">Правовая основа: {topic.law}.</p>
     {topic.items.length?<ul className="moscow-case-list">{topic.items.map(item=><li key={item.number}>
       <strong>Дело № {item.number}</strong><p>{item.subject}</p>
       <small>Тип: {item.case_type} · исследование: {item.source_observed_on} · стадия не подтверждена</small>
      </li>)}</ul>:<p className="court-source">Подтверждённых примеров этой категории в нашей ограниченной выборке пока нет. Это не означает отсутствие таких дел в суде.</p>}
     {topic.source?<a href={court.official_url+'/services/cases/'+topic.source} target="_blank" rel="noopener noreferrer">Открыть официальные дела по виду производства ↗</a>:
      <a href={court.case_service_url} target="_blank" rel="noopener noreferrer">Официальный поиск по видам производства ↗</a>}
    </div>
   </details>)}
  </div>
  <p className="court-source">Проверенные примеры хранятся на нашей странице; официальный реестр нужен для более широкой выборки, поиска по участникам, стадиям и судебным актам. Персональные данные участников не копируем.</p>
 </section>;
}
