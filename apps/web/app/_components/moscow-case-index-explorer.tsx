'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {JudgeCaseEvidence} from '../lib/moscow-judge-directory';

type CourtOption={slug:string;name:string};
export type IndexedMoscowCase=JudgeCaseEvidence&{
 judgeHref:string|null;
 appealDocket:string|null;
 appealRegisteredOn:string|null;
};
type Props={courts:CourtOption[];cases:IndexedMoscowCase[]};
const proceedingLabels:Record<JudgeCaseEvidence['proceeding'],string>={
 civil:'Гражданское дело',
 'civil-exec':'Материал об исполнении решения',
 criminal:'Уголовное дело',
 'criminal-materials':'Уголовно-процессуальный материал'
};
const normalized=(value:string)=>value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();

/** Independent search over source-bound, non-sensitive case metadata only.
 * It is NOT a complete court docket or a searchable full-text decisions corpus.
 */
export function MoscowCaseIndexExplorer({courts,cases}:Props){
 const [query,setQuery]=useState('');
 const [court,setCourt]=useState('');
 const [category,setCategory]=useState('');
 const [proceeding,setProceeding]=useState('');
 const [status,setStatus]=useState('');
 const courtNames=new Map(courts.map(c=>[c.slug,c.name]));
 const categories=useMemo(()=>[...new Map(cases.map(c=>[c.topicId,c.category])).entries()]
  .sort((a,b)=>a[1].localeCompare(b[1],'ru')),[cases]);
 const shown=useMemo(()=>{
  const q=normalized(query);
  return cases.filter(c=>
   (!court||c.courtSlug===court)&&(!category||c.topicId===category)
   &&(!proceeding||c.proceeding===proceeding)&&(!status||c.status===status)
   &&(!q||normalized([c.number,c.judgeName,c.category,c.outcome,courtNames.get(c.courtSlug)??''].join(' ')).includes(q))
  ).sort((a,b)=>(b.decisionDate??b.observedOn).localeCompare(a.decisionDate??a.observedOn)
   ||a.number.localeCompare(b.number,'ru'));
 },[query,court,category,proceeding,status,cases,courtNames]);
 const active=Boolean(query.trim()||court||category||proceeding||status);
 return <section className="court-section" id="moscow-case-search">
  <h2>Поиск по опубликованным судебным записям</h2>
  <p>Ищите дело по номеру, суду, фамилии судьи или категории спора. Поиск охватывает только внесённые на сайт сведения из официальных судебных реестров, а не все дела судов Москвы. Он не ищет по полным текстам судебных решений.</p>
  <div className="moscow-judge-controls">
   <label>Номер дела, фамилия или категория
    <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
     placeholder="Например: 02-4623/2026 или жилищный спор" maxLength={100}/>
   </label>
   <label>Суд
    <select value={court} onChange={e=>setCourt(e.target.value)}>
     <option value="">Все 35 районных судов</option>
     {courts.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}
    </select>
   </label>
   <label>Категория
    <select value={category} onChange={e=>setCategory(e.target.value)}>
     <option value="">Все опубликованные категории</option>
     {categories.map(([id,label])=><option key={id} value={id}>{label}</option>)}
    </select>
   </label>
   <label>Вид производства
    <select value={proceeding} onChange={e=>setProceeding(e.target.value)}>
     <option value="">Все виды</option>
     {Object.entries(proceedingLabels).map(([value,label])=>
      <option key={value} value={value}>{label}</option>)}
    </select>
   </label>
   <label>Сведения о результате
    <select value={status} onChange={e=>setStatus(e.target.value)}>
     <option value="">Все записи</option>
     <option value="outcome_recorded">Итог указан в реестре</option>
     <option value="pending">Итог пока не подтверждён</option>
    </select>
   </label>
  </div>
  <div className="court-filter-actions">
   {active?<button type="button" className="button button-outline"
    onClick={()=>{setQuery('');setCourt('');setCategory('');setProceeding('');setStatus('');}}>
    Сбросить фильтры
   </button>:null}
  </div>
  <p role="status" aria-live="polite"><strong>Найдено записей: {shown.length}</strong> из {cases.length} размещённых в нашем справочнике. Это не число дел, рассмотренных судами.</p>
  {shown.length===0?<div className="notice">
   <p>По выбранным условиям в нашей подборке нет записей. Это не означает, что дело отсутствует в суде или не рассматривалось.</p>
   <p><a href="https://mos-gorsud.ru/search" target="_blank" rel="noopener noreferrer">Проверить полный официальный поиск дел Москвы ↗</a></p>
  </div>:<div className="results">{shown.map(c=><article className="result-row" key={c.courtSlug+'-'+c.number+'-'+c.judgeName}>
   <div>
    <h3>Дело № {c.number}</h3>
    <p><strong>Суд:</strong> <Link href={'/courts/moscow/registry/'+c.courtSlug+'/info/cases'}>{courtNames.get(c.courtSlug)??c.courtSlug} →</Link></p>
    <p><strong>Вид:</strong> {proceedingLabels[c.proceeding]}; <strong>категория:</strong> {c.category}.</p>
    <p><strong>Судья в судебной записи:</strong> {c.judgeHref?
     <Link href={c.judgeHref}>{c.judgeName} →</Link>:c.judgeName}</p>
    <p><strong>Итог первой инстанции по реестру:</strong> {c.status==='outcome_recorded'?c.outcome:'Не подтверждён'}.
     {c.decisionDate?' Дата в записи: '+c.decisionDate+'.':''}</p>
    {c.appealDocket?<p><strong>Апелляционный материал:</strong> № {c.appealDocket}
     {c.appealRegisteredOn?' (зарегистрирован '+c.appealRegisteredOn+')':''}.
     Результат пересмотра не установлен.</p>:null}
    <p className="court-source">Источник просмотрен {c.observedOn}.
     {c.verificationLevel==='single_official_record_unchecked_live'?
      ' Запись имеется в одном официальном источнике, повторная сверка не завершена.':''}
     {' '}Мотивировка судебного акта и его полный текст по этой записи не подтверждены.</p>
    <details><summary>Сверить с официальным первоисточником</summary>
     <a href={c.sourceUrl} rel="noopener noreferrer" target="_blank">Открыть судебную запись ↗</a>
    </details>
   </div>
  </article>)}</div>}
  <p className="court-source">Присутствие номера дела или итога в реестре не доказывает содержание мотивировочной части, вступление акта в законную силу или результат его обжалования. Мы не рассчитываем вероятность победы и рейтинги судей по неполной подборке.</p>
 </section>;
}
