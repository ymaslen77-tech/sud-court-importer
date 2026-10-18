'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {MoscowCourt} from '../lib/moscow-courts';
import type {AdjudicatedCase} from '../lib/moscow-adjudicated-cases';
import {MOSCOW_CASE_TOPICS} from '../lib/moscow-case-topics';
import {REQUIRED_DOCUMENTS_PER_COURT_TOPIC,isVerifiedDocument} from '../lib/moscow-adjudicated-cases';

export function MoscowCasesExplorer({court,decisions}:{court:MoscowCourt;decisions:AdjudicatedCase[]}){
 const [search,setSearch]=useState('');
 const normalized=search.trim().toLocaleLowerCase('ru');
 const groups=useMemo(()=>MOSCOW_CASE_TOPICS.map(topic=>{
  const confirmed=decisions.filter(c=>c.topic_id===topic.id);
  const ids=new Set(confirmed.map(c=>c.number));
  const legacy=court.case_examples.filter(c=>c.topic_id===topic.id && !ids.has(c.number));
  const matches=(c:{number:string;subject:string})=>!normalized||
    [c.number,c.subject].some(x=>x.toLocaleLowerCase('ru').includes(normalized));
  return {
   ...topic,confirmed:confirmed.filter(matches),
   items:legacy.filter(matches),
   documentCount:confirmed.filter(isVerifiedDocument).length,
   allConfirmedCount:confirmed.length
  };
 }),[court.case_examples,decisions,normalized]);
 const total=groups.reduce((sum,t)=>sum+t.items.length+t.confirmed.length,0);
 return <section id="msk-cases" className="court-section">
  <span className="eyebrow">Судебная практика · по подтверждённым официальным карточкам дел</span>
  <h2>Дела суда: номер, суть спора, решение и судебный акт</h2>
  <p>Раскройте категорию права, чтобы увидеть результаты и перейти к индивидуальной странице дела. Если полный текст решения не размещён, его нельзя заменить пересказом или придуманным постановлением.</p>
  <label className="moscow-case-search" htmlFor={'cases-'+court.slug}>Поиск по номеру или теме среди размещённых дел
   <input id={'cases-'+court.slug} type="search" placeholder="Например, 02-5195/2026 или алименты" value={search} onChange={event=>setSearch(event.target.value)} maxLength={90}/>
  </label>
  <p className="court-source">Найдено в нашей подборке: {total}. Цель: {REQUIRED_DOCUMENTS_PER_COURT_TOPIC} полных проверенных судебных актов на категорию в каждом суде. Счётчик не включает дела без текста опубликованного акта.</p>
  <div className="moscow-case-topics">
   {groups.map(topic=><details key={topic.id} className="moscow-case-topic">
    <summary><span>{topic.title}</span><small>С известным результатом: {topic.allConfirmedCount} · документы: {topic.documentCount}/{REQUIRED_DOCUMENTS_PER_COURT_TOPIC}</small></summary>
    <div className="moscow-case-topic-content">
     <p>{topic.description}</p><p className="court-source">Правовая основа: {topic.law}.</p>
     {topic.confirmed.length>0?<ul className="moscow-case-list">
      {topic.confirmed.map(item=><li key={item.slug} className="moscow-decision-card">
       <strong>Дело № {item.number}</strong>
       <p><b>Суть:</b> {item.subject}</p>
       <p><b>Решение:</b> {item.disposition}, {item.decision_date} (первая инстанция).</p>
       <p className="court-source">Полный текст: {isVerifiedDocument(item)?'проверен и доступен':'пока не подтверждён для размещения'}</p>
       <Link className="text-link" href={'/courts/moscow/'+court.slug+'/cases/'+item.slug}>
        Подробнее о решении и открыть документ →
       </Link>
      </li>)}
     </ul>:null}
     {topic.items.length>0?<details className="moscow-secondary-cases">
      <summary>Другие найденные дела: {topic.items.length} (результат не подтверждён)</summary>
      <ul className="moscow-case-list">{topic.items.map(item=><li key={item.number}>
       <strong>Дело № {item.number}</strong><p>{item.subject}</p>
       <small>Решение суда в локальной базе не подтверждено. Это не означает, что суд не вынес решение.</small>
      </li>)}</ul>
     </details>:null}
     {!topic.confirmed.length&&!topic.items.length?<p className="court-source">Подтверждённых примеров этой категории в нашей ограниченной выборке пока нет. Это не означает отсутствия таких дел в суде.</p>:null}
     {topic.source?<a href={court.official_url+'/services/cases/'+topic.source} target="_blank" rel="noopener noreferrer">Расширенный официальный реестр по виду производства ↗</a>:
      <a href={court.case_service_url} target="_blank" rel="noopener noreferrer">Официальный поиск по видам производства ↗</a>}
    </div>
   </details>)}
  </div>
  <p className="court-source">Источник каждого подтверждённого решения указан в карточке. Стадия апелляции может измениться; решение первой инстанции не следует автоматически считать вступившим в силу.</p>
 </section>;
}
