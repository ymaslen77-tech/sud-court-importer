'use client';

import {useMemo,useState} from 'react';
import type {TodaySchedule} from '../lib/official-hearings';

/** Search only real case numbers returned for today's hearing list.
 * The primary court registry is not yet searchable via an authorized live API.
 */
function compactNumber(value:string):string {
 return value.normalize('NFKC').toLocaleLowerCase('ru-RU')
  .replace(/[\s№]/g,'').replace(/[‐‑‒–—−]/g,'-');
}

function officialCaseSearchUrl(sourceUrl:string):string|null {
 try {
  const url=new URL(sourceUrl);
  if(url.protocol!=='https:' || !url.hostname.endsWith('.sudrf.ru') ||
     url.username || url.password || url.port || url.pathname!=='/modules.php')return null;
  const result=new URL('/modules.php',url.origin);
  result.searchParams.set('name','sud_delo');
  result.searchParams.set('srv_num','1');
  result.searchParams.set('name_op','sf'); // official court case search form, NOT a claimed query result
  return result.toString();
 }catch{return null;}
}

export function CourtCaseSearch({report}:{report:TodaySchedule}){
 const [value,setValue]=useState('');
 const [submitted,setSubmitted]=useState('');
 const officialSearch=officialCaseSearchUrl(report.sourceUrl);
 const query=compactNumber(submitted);
 const available=report.state==='available';
 const hits=useMemo(()=>available && query.length>=2
  ?report.hearings.filter(item=>compactNumber(item.caseNumber).includes(query))
  :[],[available,query,report.hearings]);

 return <section className="court-section" id="pilot-case-search">
  <span className="eyebrow">Судебное делопроизводство</span>
  <h2>Поиск дела по номеру</h2>
  <p>Введите номер дела, чтобы найти его среди <strong>опубликованных заседаний на сегодня</strong>.
   Номер, время, зал и судья отображаются здесь; подробные материалы, движение дела,
   судебные акты и документы открываются непосредственно в официальной карточке суда.</p>
  <form className="court-case-search-form" onSubmit={event=>{
   event.preventDefault();
   setSubmitted(value.trim().slice(0,80));
  }}>
   <label htmlFor="court-case-number">Номер судебного дела</label>
   <div className="court-case-search-row">
    <input id="court-case-number" value={value} maxLength={80}
     autoComplete="off" placeholder="Например, 33-1234/2026"
     onChange={event=>{setValue(event.target.value);setSubmitted('');}} />
    <button type="submit" className="button button-red" disabled={value.trim().length<2}>Найти дело</button>
   </div>
  </form>
  {submitted&&query.length>=2?<div className="court-case-results" aria-live="polite">
   {available&&hits.length>0?<><h3>Совпадения в расписании на сегодня: {hits.length}</h3>
      <div className="court-case-hit-list">{hits.map((hit,i)=><article key={hit.caseNumber+'-'+i}>
       <div><strong>Дело № {hit.caseNumber}</strong>
        <p>{hit.time}{hit.room?' · '+hit.room:''}{hit.judge?' · '+hit.judge:''}</p>
       </div>
       {hit.url?<a href={hit.url} target="_blank" rel="noopener noreferrer">
         Официальная карточка дела ↗
       </a>:<span className="court-source">Прямая ссылка на дело не опубликована в полученных данных</span>}
      </article>)}</div>
    </>:<div className="court-schedule-state">
      <strong>{available?'В сегодняшнем расписании совпадений нет':'Сегодняшний список дел недоступен для поиска'}</strong>
      <p>Это не означает отсутствия дела в суде: в расписании отражаются только заседания на текущую дату.
       Для поиска всех производств используйте официальную форму суда.</p>
    </div>}
  </div>:null}
  <div className="court-case-search-official">
   <strong>Поиск по всем опубликованным делам этого суда</strong>
   <p>Полный реестр дел пока не синхронизирован с нашим сайтом. На официальном портале можно
    выбрать вид производства и найти дело по номеру, в том числе за прошлые годы.</p>
   {officialSearch?<a className="button button-outline" href={officialSearch}
     target="_blank" rel="noopener noreferrer">Открыть официальный поиск дел ↗</a>:<p>Официальная форма поиска временно недоступна.</p>}
   <small>При переходе откроется поисковая форма суда; при необходимости номер дела нужно ввести повторно.
    Сервис не утверждает, что нашёл дело, пока совпадение не получено из реальных данных.</small>
  </div>
 </section>;
}
