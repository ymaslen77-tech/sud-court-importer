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
 const [copyState,setCopyState]=useState<'idle'|'success'|'error'>('idle');
 const suggestions=useMemo(()=>approvedMoscowStreets(),[]);
 const listId='moscow-approved-streets-'+court.slug;
 function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  setResult(resolveMoscowTerritory({street,house,corpus,structure,currentCourtSlug:court.slug}));
 }
 const change=(setter:(s:string)=>void)=>(value:string)=>{setter(value);setResult(null);setCopyState('idle');};
 const canCheck=street.trim().length>=4&&house.trim().length>0;
 const addressText=['Москва',street.trim(),house.trim()?'дом '+house.trim():'',
   corpus.trim()?'корпус '+corpus.trim():'',structure.trim()?'строение '+structure.trim():'']
   .filter(Boolean).join(', ');
 async function copyAddress(){
  try{await navigator.clipboard.writeText(addressText);setCopyState('success');}
  catch{setCopyState('error');}
 }
 return <section className="moscow-territory-checker" aria-labelledby="msk-territory-form-title">
  <div className="moscow-territory-heading">
   <span className="eyebrow">Проверка конкретного адреса</span>
   <h3 id="msk-territory-form-title">Относится ли ваш адрес к этому суду?</h3>
   <p>Адрес проверяется по полному номеру здания, а не по названию района или ближайшей станции метро.</p>
   {!suggestions.length?<p className="moscow-territory-unavailable" role="status">
    Наш локальный официальный адресный справочник пока пуст. Поэтому сейчас сервис <strong>не может подтверждать подсудность</strong> и не должен выдавать зелёное или красное решение.
    Ниже можно подготовить полный адрес и перейти к <a href="https://mos-gorsud.ru/territorial" target="_blank" rel="noopener noreferrer">официальному поиску судов Москвы ↗</a>.
   </p>:null}
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
    <button type="submit" className="button button-red" disabled={!canCheck}>Проверить в нашем справочнике →</button>
    <button type="button" className="moscow-copy-address" disabled={!canCheck} onClick={copyAddress}>Скопировать полный адрес</button>
    <a href="https://mos-gorsud.ru/territorial" target="_blank" rel="noopener noreferrer" className="moscow-official-territory">Открыть официальный поиск ↗</a>
   </div>
  </form>
  {copyState==='success'?<p role="status" className="moscow-copy-status">Адрес скопирован. Вставьте его в поиск на официальном портале.</p>:null}
  {copyState==='error'?<p role="status" className="moscow-copy-status">Не удалось скопировать автоматически. Выделите адрес в полях формы и введите его на официальном портале.</p>:null}
  <p className="court-source">Используйте адрес без номера квартиры и ФИО. Проверка выполняется в вашем браузере; введённый адрес не отправляется на сервер и не сохраняется.</p>

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
