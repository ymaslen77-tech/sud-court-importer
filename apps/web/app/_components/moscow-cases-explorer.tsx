'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {MoscowCourt} from '../lib/moscow-courts';
import type {AdjudicatedCase} from '../lib/moscow-adjudicated-cases';
import {MOSCOW_CASE_TOPICS} from '../lib/moscow-case-topics';
import {
 REQUIRED_DOCUMENTS_PER_COURT_TOPIC,isVerifiedDocument,isFullTextTopicEligible
} from '../lib/moscow-adjudicated-cases';
import {
 normalizeCaseQuery,collectSearchMatches
} from '../lib/moscow-cases-search';

const quickSearches=['увольнение','алименты','мошенничество','ДТП','кредит','жилищные споры'];
function Highlight({text,query}:{text:string;query:string}){
 const normalized=normalizeCaseQuery(text);
 const q=normalizeCaseQuery(query);
 const position=q.length>=3?normalized.indexOf(q):-1;
 if(position<0)return <>{text}</>;
 return <>{text.slice(0,position)}<mark>{text.slice(position,position+q.length)}</mark>{text.slice(position+q.length)}</>;
}

export function MoscowCasesExplorer({court,decisions}:{court:MoscowCourt;decisions:AdjudicatedCase[]}){
 const [search,setSearch]=useState('');
 const query=normalizeCaseQuery(search);
 const searching=query.length>0;
 const groups=useMemo(()=>MOSCOW_CASE_TOPICS.map(topic=>{
  const confirmed=decisions.filter(c=>c.topic_id===topic.id);
  const ids=new Set(confirmed.map(c=>c.number));
  const legacy=court.case_examples.filter(c=>c.topic_id===topic.id&&!ids.has(c.number));
  return {
   ...topic,
   ...collectSearchMatches(topic,query,confirmed,legacy),
   allConfirmed:confirmed,
   allLegacy:legacy,
   documentCount:confirmed.filter(isVerifiedDocument).length
  };
 }),[court.case_examples,decisions,query]);

 const shown=groups.filter(g=>g.matched);
 const matchedCases=shown.reduce((n,g)=>n+g.exactDecidedCount+g.exactOtherCount,0);
 const allCases=groups.reduce((n,g)=>n+g.allDecidedCount+g.allOtherCount,0);
 const topicMatches=shown.filter(g=>g.matchedTopic).length;
 const hasQuery=searching && query.length>=2;
 return <section id="msk-cases" className="court-section">
  <span className="eyebrow">Судебная практика · по подтверждённым официальным карточкам дел</span>
  <h2>Дела суда: номер, суть спора, решение и судебный акт</h2>
  <p>Найдите категорию права по ключевому слову или номер конкретного дела. Поиск работает по названиям и описаниям категорий, а также по внесённым делам — это не поиск по полным текстам актов.</p>

  <div className="moscow-case-search">
   <label htmlFor={'cases-'+court.slug}>Поиск по ключевому слову, теме или номеру дела</label>
   <div className="moscow-case-search-controls">
    <input id={'cases-'+court.slug} type="search" placeholder="Например: увольнение, алименты, 02-5195/2026"
     value={search} onChange={event=>setSearch(event.target.value)} maxLength={90} autoComplete="off"/>
    {searching?<button type="button" onClick={()=>setSearch('')} aria-label="Очистить поиск">Очистить</button>:null}
   </div>
   <div className="moscow-case-suggestions" aria-label="Популярные темы поиска">
    <span>Частые запросы:</span>
    {quickSearches.map(term=><button type="button" key={term}
      aria-pressed={query===normalizeCaseQuery(term)}
      onClick={()=>setSearch(term)}>{term}</button>)}
   </div>
  </div>

  {searching?<div className="moscow-search-feedback" role="status" aria-live="polite">
   {hasQuery&&shown.length>0?
    <><strong>Найдено категорий: {shown.length}; совпадающих дел: {matchedCases}.</strong>
     {topicMatches>0?<span> Подходящие темы подсвечены и раскрыты ниже.</span>:null}
     {matchedCases===0?<p>Подходящая тематика есть, но <b>судебных дел непосредственно по этому запросу в нашей подборке пока нет</b>. Это не означает отсутствия таких дел у суда.</p>:null}
    </>:
    <><strong>Совпадений в размещённой подборке нет.</strong>
     <p>Попробуйте другую формулировку или проверьте полный официальный реестр суда.</p></>}
  </div>:
   <p className="court-source">В каталоге суда: {allCases} записей (включая дела без подтверждённого результата). Цель: до {REQUIRED_DOCUMENTS_PER_COURT_TOPIC} проверенных судебных актов на разрешённую к публикации категорию. Для семейно-правовых дел полные тексты не публикуются в силу статьи 15 Закона № 262-ФЗ.</p>}

  {searching&&shown.length===0?
   <div className="moscow-search-empty">
    <p>По запросу «{search.trim()}» подходящих категорий и размещённых дел не найдено.</p>
    <a href={court.case_service_url} target="_blank" rel="noopener noreferrer">Посмотреть официальный реестр всех дел суда ↗</a>
   </div>:null}

  <div className="moscow-case-topics">
   {shown.map(topic=>{
    const shownDecided=topic.decidedMatches;
    const shownOther=topic.otherMatches;
    const exact=topic.exactDecidedCount+topic.exactOtherCount;
    const hasExact=exact>0;
    const topicOnly=searching&&topic.matchedTopic&&!hasExact&&!topic.broadTopic;
    return <details key={topic.id+'-'+query} className={'moscow-case-topic'+(searching?' moscow-case-topic-matched':'')}
      open={searching} data-topic={topic.id}>
     <summary>
      <span className="moscow-case-topic-title">
       <Highlight text={topic.title} query={query}/>
       {searching&&topic.matchedTopic?<span className="moscow-topic-match-label">Подходящая тема</span>:null}
      </span>
      <small>{searching?
       'По запросу: '+exact+' · в категории: '+(topic.allDecidedCount+topic.allOtherCount):
       'С известным результатом: '+topic.allDecidedCount+' · '+(isFullTextTopicEligible(topic.id)?
        'документы: '+topic.documentCount+'/'+REQUIRED_DOCUMENTS_PER_COURT_TOPIC:
        'полный текст: публикация исключена законом')}</small>
     </summary>
     <div className="moscow-case-topic-content">
      <p><Highlight text={topic.description} query={query}/></p>
      <p className="court-source">Правовая основа: {topic.law}.</p>

      {topicOnly?<p className="moscow-topic-no-exact">
       По ключевому слову «{search.trim()}» именно в этой категории конкретных совпадающих дел у нас пока нет.
       Ниже можно посмотреть другие дела категории или открыть официальный реестр.
      </p>:null}

      {shownDecided.length>0?<ul className="moscow-case-list">
       {shownDecided.map(item=><li key={item.slug} className="moscow-decision-card">
        <strong>Дело № <Highlight text={item.number} query={query}/></strong>
        <p><b>Суть:</b> <Highlight text={item.subject} query={query}/></p>
        <p><b>Итог первой инстанции:</b> <Highlight text={item.disposition} query={query}/>, {item.decision_date} (первая инстанция).</p>
        <p className="court-source">Полный текст: {isVerifiedDocument(item)?'проверен и доступен':
          !isFullTextTopicEligible(item.topic_id)?'публикация исключена законом':
          item.official_file_listed?'обнаружен на официальном портале, перенос не завершён':'пока не подтверждён для размещения'}</p>
        <Link className="text-link" href={'/courts/moscow/'+court.slug+'/cases/'+item.slug}>
         Открыть карточку решения и документ →
        </Link>
       </li>)}
      </ul>:null}

      {shownOther.length>0?<details className="moscow-secondary-cases" open={searching&&hasExact?true:undefined}>
       <summary>Дела без подтверждённого результата: {shownOther.length}</summary>
       <ul className="moscow-case-list">{shownOther.map(item=><li key={item.number}>
        <strong>Дело № <Highlight text={item.number} query={query}/></strong>
        <p><Highlight text={item.subject} query={query}/></p>
        <small>Результат рассмотрения в локальной базе не подтверждён.</small>
       </li>)}</ul>
      </details>:null}

      {topicOnly&&(topic.allDecidedCount+topic.allOtherCount)>0?
       <details className="moscow-secondary-cases">
        <summary>Другие дела этой категории — {topic.allDecidedCount+topic.allOtherCount} (не совпадают с запросом)</summary>
        <ul className="moscow-case-list">
         {topic.allConfirmed.map(item=><li key={item.slug}>
          <strong>№ {item.number}</strong>
          <p>{item.subject}</p>
          <Link href={'/courts/moscow/'+court.slug+'/cases/'+item.slug}>Карточка дела →</Link>
         </li>)}
         {topic.allLegacy.map(item=><li key={item.number}>
          <strong>№ {item.number}</strong><p>{item.subject}</p>
          <small>Результат рассмотрения не подтверждён.</small>
         </li>)}
        </ul>
       </details>:null}

      {!searching&&!topic.allDecidedCount&&!topic.allOtherCount?
       <p className="court-source">Подтверждённых примеров этой категории в нашей ограниченной выборке пока нет. Это не означает отсутствия таких дел в суде.</p>:null}
      {topic.source?<a href={court.official_url+'/services/cases/'+topic.source} target="_blank" rel="noopener noreferrer">
        Посмотреть больше дел в официальном реестре ↗</a>:
       <a href={court.case_service_url} target="_blank" rel="noopener noreferrer">Официальный поиск по видам производства ↗</a>}
     </div>
    </details>;
   })}
  </div>
  <p className="court-source">Поиск по опубликованным на нашей странице сведениям, без обращения к внешней базе при вводе. Источник каждого подтверждённого результата указан в карточке. Решение первой инстанции не обязательно вступило в законную силу.</p>
 </section>;
}
