'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import {CONSTITUTIONAL_CASES,CONSTITUTIONAL_THEMES} from '../lib/constitutional-practice';

const base='/courts/reference/constitutional-court-rf/practice';
export function ConstitutionalPracticeCatalog(){
 const [query,setQuery]=useState('');
 const [theme,setTheme]=useState('');
 const [year,setYear]=useState('');
 const items=useMemo(()=>CONSTITUTIONAL_CASES.filter(c=>{
  const q=query.trim().toLocaleLowerCase('ru');
  return (!q||[c.number,c.year,c.title,c.issue,c.norm,c.theme,c.position,c.relatedTerm].join(' ').toLocaleLowerCase('ru').includes(q))
   &&(!theme||c.theme===theme)&&(!year||String(c.year)===year);
 }).sort((a,b)=>b.isoDate.localeCompare(a.isoDate)),[query,theme,year]);
 return <div className="ksrf-practice-catalog">
  <div className="ksrf-practice-controls">
   <label>Поиск по номеру, теме, норме или правовой позиции
    <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
     placeholder="Например: 27-П, жильё, компенсация" autoComplete="off"/>
   </label>
   <label>Тема
    <select value={theme} onChange={e=>setTheme(e.target.value)}>
     <option value="">Все темы</option>
     {CONSTITUTIONAL_THEMES.map(t=><option key={t} value={t}>{t}</option>)}
    </select>
   </label>
   <label>Год
    <select value={year} onChange={e=>setYear(e.target.value)}>
     <option value="">Все годы</option>
     <option value="2026">2026</option>
     <option value="2025">2025</option>
    </select>
   </label>
  </div>
  <p role="status" aria-live="polite" className="ksrf-practice-count">
   Найдено {items.length} из {CONSTITUTIONAL_CASES.length} проверенных редакционных карточек
  </p>
  <div className="ksrf-practice-grid">
   {items.map(c=><article key={c.slug} className="ksrf-practice-tile">
    <p className="ksrf-practice-meta"><strong>№ {c.number}/{c.year}</strong><span>{c.date}</span></p>
    <span className="ksrf-practice-theme">{c.theme}</span>
    <h2><Link href={base+'/'+c.slug}>{c.title}</Link></h2>
    <p>{c.issue}</p>
    <small><strong>Оспоренная норма:</strong> {c.norm}</small>
    <div className="ksrf-practice-actions">
     <Link href={base+'/'+c.slug}>Разобрать решение →</Link>
     <a href={c.source} target="_blank" rel="noopener noreferrer">Первоисточник ↗</a>
    </div>
   </article>)}
  </div>
  {!items.length?<p>В проверенной подборке нет совпадений. Попробуйте другой запрос или официальный расширенный поиск КС РФ.</p>:null}
  <div className="ksrf-practice-links">
   <a href="https://www.ksrf.ru/Decision/extsearch.php" target="_blank" rel="noopener noreferrer">Официальный расширенный поиск ↗</a>
   <a href="https://www.ksrf.ru/Decision/lp/" target="_blank" rel="noopener noreferrer">Официальный каталог правовых позиций ↗</a>
  </div>
 </div>;
}
