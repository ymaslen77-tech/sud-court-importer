'use client';
import {useState} from 'react';

type Entry={courtName:string;courtCode:string};
export function MagistrateList({items}:{items:Entry[]}) {
 const [query,setQuery]=useState('');
 const needle=query.trim().toLocaleLowerCase('ru-RU');
 const filtered=items.filter(x=>
   !needle || x.courtName.toLocaleLowerCase('ru-RU').includes(needle)
   || x.courtCode.toLocaleLowerCase('ru-RU').includes(needle)
 );
 return <>
  <div className="directory-tools">
    <label htmlFor="magistrate-filter" className="sr-only">Поиск по участку или его коду</label>
    <input id="magistrate-filter" type="search" maxLength={120}
      placeholder="Номер участка, район или код…"
      value={query} onChange={e=>setQuery(e.target.value)} />
  </div>
  <p className="muted">Найдено в предварительном перечне: {filtered.length}</p>
  {filtered.length ? <ol className="arbitr-list">
    {filtered.map((x,i)=><li key={x.courtCode}>
      <span className="arbitr-number">{String(i+1).padStart(2,'0')}</span>
      <span>{x.courtName}<small>Официально опубликованный классификационный код: {x.courtCode}</small></span>
      <span className="arbitr-state">Нужна проверка</span>
    </li>)}
  </ol> : <div className="empty-state">В выборке совпадения не найдены.</div>}
 </>;
}
