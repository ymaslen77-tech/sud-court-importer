'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {MoscowJudgeProfile,JudgeCaseEvidence} from '../lib/moscow-judge-directory';
import {moscowJudgeHref,moscowJudgeSourceLabel} from '../lib/moscow-judge-directory';

type CourtOption={slug:string;name:string;href:string};
type Props={courts:CourtOption[];profiles:MoscowJudgeProfile[];cases:JudgeCaseEvidence[]};
const noOutcome='Результат пока не подтверждён';
export function MoscowJudgesExplorer({courts,profiles,cases}:Props){
 const [court,setCourt]=useState('');
 const [judge,setJudge]=useState('');
 const [category,setCategory]=useState('');
 const [status,setStatus]=useState('all');
 const [search,setSearch]=useState('');
 const options=useMemo(()=>profiles.filter(p=>p.courtSlug===court&&
   (!search.trim()||p.name.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru')))),[court,profiles,search]);
 const selected=profiles.find(p=>p.courtSlug===court&&p.judgeSlug===judge);
 const linked=selected?cases.filter(c=>c.courtSlug===court&&c.judgeName===selected.name):[];
 const categories=[...new Map(linked.map(c=>[c.topicId,c.category])).entries()];
 const shown=linked.filter(c=>(!category||c.topicId===category)&&(status==='all'||c.status===status));
 const chosenCourt=courts.find(c=>c.slug===court);
 return <div className="moscow-judge-explorer">
  <div className="moscow-judge-controls">
   <label>Выберите суд
    <select value={court} onChange={e=>{setCourt(e.target.value);setJudge('');setCategory('');setStatus('all');setSearch('');}}>
     <option value="">Все московские районные суды</option>
     {courts.map(c=><option value={c.slug} key={c.slug}>{c.name}</option>)}
    </select>
   </label>
   <label>Найдите судью по ФИО
    <input value={search} onChange={e=>{setSearch(e.target.value);setJudge('');setCategory('');setStatus('all');}}
     placeholder="Фамилия или имя" disabled={!court} type="search" maxLength={90}/>
   </label>
   <label>Выберите судью
    <select value={judge} disabled={!court||options.length===0}
     onChange={e=>{setJudge(e.target.value);setCategory('');setStatus('all');}}>
     <option value="">Выберите из списка</option>
     {options.map(p=><option value={p.judgeSlug} key={p.judgeSlug}>{p.name}</option>)}
    </select>
   </label>
  </div>
  {court&&options.length===0?<p role="status">В локальной подборке нет подтверждённого ФИО по этому запросу. Это не означает, что судья не работает в суде. <a href="https://mos-gorsud.ru/rs" target="_blank" rel="noopener noreferrer">Проверьте официальный состав ↗</a></p>:null}
  {selected?<section aria-live="polite" className="moscow-judge-result">
   <h2>{selected.name}</h2>
   <p><strong>Суд:</strong> {selected.courtName}. <strong>Основание:</strong> {moscowJudgeSourceLabel(selected.sourceKind)}.</p>
   <p className="court-source">Источник обновлён: {selected.sourceUpdatedOn??'дата обновления не указана'}; дата сверки: {selected.sourceObservedOn}. Публикация не подтверждает актуальные полномочия на сегодняшний день.</p>
   {selected.appointmentBasis?<p><strong>Опубликованное основание:</strong> {selected.appointmentBasis}</p>:null}
   <p><a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">Официальный источник сведений о судье ↗</a></p>
   <h3>Дела и результаты в проверенной выборке</h3>
   <p>{linked.length>0?'Учитываются только записи, где в одной официальной строке указаны суд, судья и номер дела.':'В нашей локальной выборке нет дел с проверенной привязкой к этому судье. Откройте официальный поиск, чтобы изучить полный реестр.'}</p>
   {linked.length>0?<div className="moscow-judge-case-filters">
     <label>Категория права
      <select value={category} onChange={e=>setCategory(e.target.value)}>
       <option value="">Все внесённые категории</option>
       {categories.map(([id,name])=><option key={id} value={id}>{name}</option>)}
      </select>
     </label>
     <label>Результат
      <select value={status} onChange={e=>setStatus(e.target.value)}>
       <option value="all">Все записи</option><option value="outcome_recorded">Результат указан в реестре</option>
       <option value="pending">Дело без подтверждённого результата</option>
      </select>
     </label>
    </div>:null}
   <div role="status"><strong>Записей в нашей выборке:</strong> {shown.length}. Это не общее количество дел судьи.</div>
   <div className="moscow-judge-case-cards">
    {shown.map(c=><article key={c.number}>
      <h4>Дело № {c.number}</h4>
      <p><strong>Категория:</strong> {c.category}</p>
      <p><strong>Судопроизводство:</strong> {c.proceeding==='civil'?'Гражданские дела (ГПК РФ)':'Уголовно-процессуальные материалы (УПК РФ)'}</p>
      <p><strong>Результат:</strong> {c.status==='outcome_recorded'?c.outcome:noOutcome}
       {c.decisionDate?' · '+c.decisionDate:''}</p>
      <p className="court-source">{c.note}</p>
      <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Сверить строку в официальном реестре ↗</a>
     </article>)}
   </div>
   <p><Link className="text-link" href={moscowJudgeHref(selected)}>Персональная страница: все подтверждённые сведения и категории →</Link></p>
  </section>:court?<p>Выберите судью из списка — появятся её или его подтверждённые дела, если они есть в собранной выборке.</p>:<p>Начните с выбора суда. В каталоге будут показаны судьи из опубликованных официальных списков и отдельных кадровых сообщений. Это не исчерпывающий действующий штат.</p>}
  {chosenCourt?<p><Link href={chosenCourt.href} className="text-link">Открыть карточку выбранного суда →</Link></p>:null}
  <p className="court-source">Не рассчитываем «процент побед», вероятность решения и персональные рейтинги: неполная выборка и различия в видах дел не позволяют делать такие выводы.</p>
 </div>;
}
