'use client';

import {useMemo, useState} from 'react';

type Entry = {name:string;kind:string};
export function ArbitrationNames({items}:{items:Entry[]}) {
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState<'all'|'arbitration-subject'|'arbitration-presence'>('all');
  const results=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase('ru-RU');
    return items.filter(item=>
      (category==='all'||item.kind===category)
      && (!q || item.name.toLocaleLowerCase('ru-RU').includes(q))
    );
  },[items,query,category]);
  return <>
    <div className="directory-tools">
      <label htmlFor="arbitr-filter" className="sr-only">Поиск по названию суда</label>
      <input id="arbitr-filter" type="search" placeholder="Фильтр по названию суда…"
        value={query} onChange={event=>setQuery(event.target.value)} maxLength={120}/>
      <div className="directory-tabs" aria-label="Тип суда">
        <button type="button" className={category==='all'?'selected':''} onClick={()=>setCategory('all')}>Все</button>
        <button type="button" className={category==='arbitration-subject'?'selected':''} onClick={()=>setCategory('arbitration-subject')}>Суды субъектов</button>
        <button type="button" className={category==='arbitration-presence'?'selected':''} onClick={()=>setCategory('arbitration-presence')}>Судебные присутствия</button>
      </div>
    </div>
    <p className="muted">{results.length} записей в справочном списке</p>
    {results.length ? <ol className="arbitr-list">
      {results.map((item,i)=><li key={item.name}>
        <span className="arbitr-number">{String(i+1).padStart(2,'0')}</span>
        <span>{item.name}<small>{item.kind==='arbitration-presence'?'Постоянное судебное присутствие':'Арбитражный суд субъекта РФ'}</small></span>
        <span className="arbitr-state">Нужна проверка</span>
      </li>)}
    </ol> : <div className="empty-state">По заданным параметрам названия не найдены.</div>}
  </>;
}
