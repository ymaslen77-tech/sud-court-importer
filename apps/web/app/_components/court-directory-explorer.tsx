'use client';
import {useMemo,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {COURT_CATEGORIES} from '../lib/court-taxonomy';
import {DIRECTORY_REGIONS} from '../lib/directory-regions';
import {
 filterDirectoryEntries,paginateDirectoryEntries,normalizedCourtSearch,
 type DirectoryEntry
} from '../lib/court-directory-search';

type Props={entries:DirectoryEntry[];initialValue?:string;initialKind?:string;initialRegion?:string};
export function CourtDirectoryExplorer({
 entries,initialValue='',initialKind='',initialRegion=''
}:Props){
 const [value,setValue]=useState(initialValue);
 const [kind,setKind]=useState(initialKind);
 const [region,setRegion]=useState(initialRegion);
 const [page,setPage]=useState(1);
 const availableRegions=useMemo(()=>new Set(entries.map(r=>r.region).filter(Boolean)),[entries]);
 const filtered=useMemo(()=>filterDirectoryEntries(entries,{query:value,kind,region}),[entries,value,kind,region]);
 const pages=useMemo(()=>paginateDirectoryEntries(filtered,page,20),[filtered,page]);
 const selected=region?DIRECTORY_REGIONS.find(x=>x.slug===region):null;
 const chosenKind=kind?COURT_CATEGORIES.find(x=>x.slug===kind):null;
 const qs=new URLSearchParams();
 if(value.trim())qs.set('q',value.trim().slice(0,100));
 if(kind)qs.set('kind',kind);
 if(region)qs.set('region',region);
 const share='/search'+(qs.size?'?'+qs.toString():'');
 const setFilters=(next:{value?:string;kind?:string;region?:string})=>{
  if(next.value!==undefined)setValue(next.value);
  if(next.kind!==undefined)setKind(next.kind);
  if(next.region!==undefined)setRegion(next.region);
  setPage(1);
 };
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setPage(1);}
 const fullyQualified=entries.filter(x=>x.href.startsWith('/courts/')&&!x.href.endsWith('/arbitration')).length;
 return <div className="court-directory-explorer" id="catalog-search">
  <div className="section-intro">
   <span className="eyebrow">Единый поиск по имеющимся сведениям</span>
   <h2>Найти суд по России</h2>
   <p>Название, код, адрес здания, регион и вид суда. Результаты обновляются сразу; непроверенные записи отдельно обозначены.</p>
  </div>
  <form role="search" onSubmit={submit} className="court-advanced-search" aria-label="Поиск по каталогу судов">
   <div className="court-filter-grid">
    <label htmlFor="directory-find-query" className="filter-full">Название суда, код или известный адрес здания
     <input id="directory-find-query" name="q" type="search" value={value} maxLength={100}
      placeholder="Например: Лефортовский, 54RS0012 или Барабинск"
      onChange={e=>setFilters({value:e.target.value})} autoComplete="off"/>
    </label>
    <label htmlFor="directory-find-kind">Вид суда
     <select id="directory-find-kind" name="kind" value={kind} onChange={e=>setFilters({kind:e.target.value})}>
      <option value="">Все виды</option>
      {COURT_CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.short}</option>)}
     </select>
    </label>
    <label htmlFor="directory-find-region">Регион
     <select id="directory-find-region" name="region" value={region} onChange={e=>setFilters({region:e.target.value})}>
      <option value="">Все регионы</option>
      <optgroup label="Есть предварительные сведения">
       {DIRECTORY_REGIONS.filter(r=>availableRegions.has(r.slug)).map(r=><option value={r.slug} key={r.slug}>{r.name}</option>)}
      </optgroup>
      <optgroup label="Ожидают наполнения">
       {DIRECTORY_REGIONS.filter(r=>!availableRegions.has(r.slug)).map(r=><option value={r.slug} key={r.slug}>{r.name} — пока нет карточек</option>)}
      </optgroup>
     </select>
    </label>
   </div>
   <div className="court-filter-actions">
    <button className="button button-red" type="submit">Показать результаты</button>
    <button className="court-directory-reset" type="button"
     onClick={()=>setFilters({value:'',kind:'',region:''})}>Сбросить фильтры</button>
    <Link className="text-link" href={share}>Ссылка на результаты ↗</Link>
   </div>
  </form>
  <div className="court-directory-shortcuts" aria-label="Быстрый выбор">
   <span>Быстрый поиск:</span>
   <button type="button" onClick={()=>setFilters({value:'',region:'moscow',kind:'general-district'})}>Районные суды Москвы</button>
   <button type="button" onClick={()=>setFilters({value:'',region:'region-54',kind:''})}>Новосибирская область</button>
   <button type="button" onClick={()=>setFilters({value:'',region:'',kind:'arbitration-subject'})}>Арбитражные суды</button>
   <button type="button" onClick={()=>setFilters({value:'',region:'region-27',kind:'general-magistrate'})}>Мировые судьи</button>
  </div>
  <p className="court-form-hint">В доступной подборке {entries.length} записей, из них {fullyQualified} с отдельными страницами в нашем проекте. Это не полный реестр всех судов России и не проверка подсудности по адресу заявителя.</p>
  <div className="court-directory-result-status" role="status" aria-live="polite">
   <strong>Найдено: {filtered.length}</strong>
   {(selected||chosenKind)?<span> · {[selected?.name,chosenKind?.short].filter(Boolean).join(' · ')}</span>:null}
   <span> · Страница {pages.page} из {pages.pages}</span>
  </div>
  {filtered.length>0?<div className="results" aria-label="Найденные суды">{pages.items.map(item=>
   <Link key={item.id} className="result-row court-directory-result" href={item.href}>
    <span>
     <strong>{item.name}</strong>
     <small>{[item.kindLabel,item.regionName,item.code].filter(Boolean).join(' · ')}</small>
     {item.address?<small>Адрес здания по исходной записи: {item.address}</small>:null}
     <small className="court-directory-provenance">
      {item.status==='reference'?'Справочная карточка с официальными ссылками · актуальность требует проверки':
       item.status==='research'?'Исследовательская карточка · актуальность требует проверки':
       'Название из официального перечня · подробная карточка ещё не подготовлена'}
     </small>
    </span><span aria-hidden="true">↗</span>
   </Link>
  )}</div>:<div className="empty-state" role="note">
   <h3>В нашей подборке таких записей пока нет</h3>
   <p>Отсутствие результата не означает, что суд не существует. {selected?'Для региона «'+selected.name+'» требуется дополнительное наполнение.':'Попробуйте другой запрос или снимите фильтр.'}</p>
   <a className="text-link" href="https://sudrf.ru/index.php?act=go_search&id=300&searchtype=fs" rel="noopener noreferrer" target="_blank">Поискать федеральный суд в официальном реестре ↗</a>
   <p><a className="text-link" href="https://sudrf.ru/index.php?act=go_ms_search&id=300&searchtype=ms" rel="noopener noreferrer" target="_blank">Поиск мировых судей на официальном портале ↗</a></p>
  </div>}
  {filtered.length>0&&pages.pages>1?<nav className="category-pagination" aria-label="Страницы результатов поиска">
   <button type="button" disabled={pages.page<=1} onClick={()=>setPage(1)}>Первая</button>
   <button type="button" disabled={pages.page<=1} onClick={()=>setPage(x=>Math.max(1,x-1))}>← Предыдущая</button>
   <span>Страница {pages.page} / {pages.pages}</span>
   <button type="button" disabled={pages.page>=pages.pages} onClick={()=>setPage(x=>Math.min(pages.pages,x+1))}>Следующая →</button>
   <button type="button" disabled={pages.page>=pages.pages} onClick={()=>setPage(pages.pages)}>Последняя</button>
  </nav>:null}
  <p className="court-source">Надёжная подсудность по адресу участника спора устанавливается отдельно. Название региона, адрес здания суда или совпадение в поиске не являются определением подсудности. <Link href="/jurisdiction">Правила подбора по адресу →</Link></p>
 </div>;
}
