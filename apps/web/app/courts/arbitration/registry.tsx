'use client';

import {useMemo, useState} from 'react';

type Entry = {name:string;kind:string};
const kinds = {
  'arbitration-subject':'Арбитражный суд субъекта РФ',
  'arbitration-presence':'Постоянное судебное присутствие',
  'arbitration-appeal':'Арбитражный апелляционный суд',
  'arbitration-district':'Арбитражный суд округа',
  'arbitration-ip':'Суд по интеллектуальным правам'
} as const;
type Kind = keyof typeof kinds;
export function ArbitrationNames({items,initialQuery=''}:{items:Entry[];initialQuery?:string}) {
  const [query,setQuery] = useState(initialQuery);
  const [category,setCategory] = useState<'all'|Kind>('all');
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
        <button type="button" className={category==='arbitration-appeal'?'selected':''} onClick={()=>setCategory('arbitration-appeal')}>Апелляционные</button>
        <button type="button" className={category==='arbitration-district'?'selected':''} onClick={()=>setCategory('arbitration-district')}>Окружные</button>
        <button type="button" className={category==='arbitration-ip'?'selected':''} onClick={()=>setCategory('arbitration-ip')}>Интеллектуальные права</button>
      </div>
    </div>
    <p className="muted">{results.length} записей в справочном списке</p>
    {results.length ? <ol className="arbitr-list">
      {results.map((item,i)=><li key={item.name}>
        <span className="arbitr-number">{String(i+1).padStart(2,'0')}</span>
        <span>{item.name}<small>{kinds[item.kind as Kind]??'Категория требует проверки'}</small></span>
        <span className="arbitr-state">Нужна проверка</span>
      </li>)}
    </ol> : <div className="empty-state">По заданным параметрам названия не найдены.</div>}
  </>;
}
