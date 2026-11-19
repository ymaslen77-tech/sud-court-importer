'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';

export type MoscowCourtFinderItem={
 slug:string;name:string;href:string;address:string;metro:string|null;
 temporary:boolean;
};
const normalize=(value:string)=>value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();

export function MoscowCourtQuickFinder({courts}:{courts:readonly MoscowCourtFinderItem[]}){
 const [search,setSearch]=useState('');
 const q=normalize(search);
 const matches=useMemo(()=>{
  if(q.length<2)return [];
  const words=q.split(/\s+/);
  return courts.filter(c=>{
   const hay=normalize([c.name,c.address,c.metro??'',c.slug].join(' '));
   return words.every(w=>hay.includes(w));
  }).slice(0,12);
 },[courts,q]);
 return <section className="court-section" aria-label="Поиск районного суда Москвы">
  <span className="eyebrow">Выберите свой суд</span>
  <h2>Найдите суд по названию, адресу или ближайшему метро</h2>
  <p>Введите название суда, улицу из опубликованного адреса или станцию метро.
   Ниже появятся подходящие карточки — с внутренними разделами о подаче документов, делах и обжаловании.</p>
  <label className="moscow-territory-street" htmlFor="moscow-court-quick-search">
   Название суда или ориентир
  </label>
  <input id="moscow-court-quick-search" className="moscow-court-quick-search"
   type="search" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)}
   autoComplete="off" placeholder="Например, Лефортовский, Каланчёвская, Бабушкинская"/>
  {q.length>=2?<div role="status" aria-live="polite">
   <p>{matches.length>0?'Подходящие суды (показаны первые 12):':'По введённым словам совпадений нет. Посмотрите полный перечень ниже.'}</p>
   {matches.length>0?<div className="results">{matches.map(c=><article className="result-row" key={c.slug}>
    <span><strong><Link href={c.href}>{c.name} →</Link></strong>
     <small>{c.address}</small>
     {c.metro?<small>Метро из справочника: {c.metro}</small>:null}
     {c.temporary?<small>Есть сведения о временном размещении подразделений. Адрес посещения уточняйте по извещению.</small>:null}
     <small><Link href={c.href}>Полная карточка</Link> · <Link href={'/courts/moscow/registry/'+c.slug+'/info/filing'}>Подача документов</Link> · <Link href={'/courts/moscow/registry/'+c.slug+'/info/cases'}>Дела</Link> · <Link href={'/courts/moscow/registry/'+c.slug+'/info/appeal'}>Обжалование</Link></small>
    </span>
   </article>)}</div>:null}
  </div>:<p className="court-source">Все 35 районных судов с адресами и контактами перечислены ниже; поиск помогает быстро открыть нужный.</p>}
  <p className="court-source">Поиск сравнивает названия и известные адреса судов, но не определяет территориальную подсудность вашего дома. Для этого нужен отдельный адресный сервис.</p>
 </section>;
}
