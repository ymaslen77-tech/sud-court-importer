'use client';
import Link from 'next/link';
import {useMemo,useState,type FormEvent} from 'react';
import type {MoscowCourt} from '../lib/moscow-courts';
import {
 approvedMoscowStreets,resolveMoscowTerritory,type TerritoryResult
} from '../lib/resolve-moscow-territory';

export function MoscowTerritoryChecker({court}:{court:MoscowCourt}){
 const [street,setStreet]=useState('');
 const [house,setHouse]=useState('');
 const [corpus,setCorpus]=useState('');
 const [structure,setStructure]=useState('');
 const [result,setResult]=useState<TerritoryResult|null>(null);
 const suggestions=useMemo(()=>approvedMoscowStreets(),[]);
 const listId='moscow-approved-streets-'+court.slug;
 function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  setResult(resolveMoscowTerritory({street,house,corpus,structure,currentCourtSlug:court.slug}));
 }
 const change=(setter:(s:string)=>void)=>(value:string)=>{setter(value);setResult(null);};
 const canCheck=street.trim().length>=4&&house.trim().length>0;
 return <section className="moscow-territory-checker" aria-labelledby="msk-territory-form-title">
  <div className="moscow-territory-heading">
   <span className="eyebrow">Проверка конкретного адреса</span>
   <h3 id="msk-territory-form-title">Относится ли ваш адрес к этому суду?</h3>
   <p>Адрес проверяется по полному номеру здания, а не по названию района или ближайшей станции метро.</p>
  </div>
  <form className="moscow-territory-form" onSubmit={submit}>
   <label>Город
    <input value="Москва" readOnly aria-readonly="true" className="moscow-territory-city"/>
   </label>
   <label className="moscow-territory-street">Улица, переулок, проспект или площадь
    <input value={street} autoComplete="off" list={listId} maxLength={120} required
      placeholder="Начните вводить улицу" onChange={e=>change(setStreet)(e.target.value)}/>
    <datalist id={listId}>{suggestions.map(s=><option key={s} value={s}/>)}</datalist>
   </label>
   <label>Дом
    <input value={house} maxLength={20} required placeholder="Например, 12"
      onChange={e=>change(setHouse)(e.target.value)}/>
   </label>
   <label>Корпус <small>(при наличии)</small>
    <input value={corpus} maxLength={20} placeholder="Например, 2"
      onChange={e=>change(setCorpus)(e.target.value)}/>
   </label>
   <label>Строение <small>(при наличии)</small>
    <input value={structure} maxLength={20} placeholder="Например, 1"
      onChange={e=>change(setStructure)(e.target.value)}/>
   </label>
   <div className="moscow-territory-action">
    <button type="submit" className="button button-red" disabled={!canCheck}>Проверить подсудность →</button>
   </div>
  </form>
  <p className="court-source">Используйте адрес без номера квартиры и ФИО. Проверка выполняется в вашем браузере; введённый адрес не отправляется на сервер и не сохраняется.</p>
  {!suggestions.length?<p className="court-source">Проверенный справочник улиц сейчас наполняется. Можно ввести адрес вручную, но отсутствие записи даст нейтральный результат, а не ложное «не относится».</p>:null}
  {result?<div className={'moscow-territory-result moscow-territory-'+result.kind} role="status" aria-live="polite" data-result={result.kind}>
   {result.kind==='match'?<>
    <strong>✓ Да, адрес относится к этому суду</strong>
    <p>По проверенной территориальной записи: <b>{result.courtName}</b>.</p>
    <p className="court-source">Сверено: {result.reviewedOn}. <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">Официальный источник ↗</a></p>
   </>:result.kind==='other'?<>
    <strong>✕ Нет, по данному адресу указан другой суд</strong>
    <p>Территориально относится к: <b>{result.courtName}</b>.</p>
    {result.external?<a href={result.courtUrl} target="_blank" rel="noopener noreferrer" className="text-link">Открыть официальный сайт другого суда ↗</a>:
     <Link className="text-link" href={result.courtUrl}>Перейти к карточке другого суда →</Link>}
    <p className="court-source">Проверка: {result.reviewedOn}. <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">Официальное подтверждение ↗</a></p>
   </>:<>
    <strong>Пока нельзя достоверно определить суд</strong>
    <p>{result.reason}</p>
    <p>Уточните адрес и <a href={court.territory_service_url} target="_blank" rel="noopener noreferrer">проверьте его на официальном портале судов Москвы ↗</a>.</p>
   </>}
  </div>:null}
  <p className="court-source">Это определение территориального района районного суда. Компетенция мирового судьи, арбитражного суда, исключительная и альтернативная подсудность проверяются отдельно.</p>
 </section>;
}
