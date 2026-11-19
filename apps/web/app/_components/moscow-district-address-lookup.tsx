'use client';
import {useState,type FormEvent} from 'react';

/** Address preparation only, not a fake claim of house-by-house jurisdiction.
 * The official portal is the source of the determination.
 */
export function MoscowDistrictAddressLookup({courtName}:{courtName:string}){
 const [street,setStreet]=useState('');
 const [house,setHouse]=useState('');
 const [corpus,setCorpus]=useState('');
 const [building,setBuilding]=useState('');
 const [copied,setCopied]=useState<'idle'|'copied'|'manual'>('idle');
 const value=['Москва',street.trim(),house.trim()?'дом '+house.trim():'',
  corpus.trim()?'корпус '+corpus.trim():'',
  building.trim()?'строение '+building.trim():''].filter(Boolean).join(', ');
 const valid=street.trim().length>=3&&house.trim().length>0;
 async function copy(){
  try{await navigator.clipboard.writeText(value);setCopied('copied');}
  catch{setCopied('manual');}
 }
 function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!valid)return;
  window.open('https://mos-gorsud.ru/territorial','_blank','noopener,noreferrer');
  void copy();
 }
 return <div className="moscow-territory-checker">
  <h3>Подготовить адрес для официального определения подсудности</h3>
  <p>Мы подготовим адрес, а решение о территориальной подсудности вы проверите в официальном сервисе. Точного локального реестра улиц и домов для «{courtName}» пока нет.</p>
  <form onSubmit={submit} className="moscow-territory-form">
   <label className="moscow-territory-street">Улица, переулок или проспект
    <input value={street} onChange={e=>{setStreet(e.target.value);setCopied('idle');}} required maxLength={120} placeholder="Название улицы"/>
   </label>
   <label>Дом
    <input value={house} onChange={e=>{setHouse(e.target.value);setCopied('idle');}} required maxLength={20} placeholder="12"/>
   </label>
   <label>Корпус (если есть)
    <input value={corpus} onChange={e=>setCorpus(e.target.value)} maxLength={20} placeholder="2"/>
   </label>
   <label>Строение (если есть)
    <input value={building} onChange={e=>setBuilding(e.target.value)} maxLength={20} placeholder="1"/>
   </label>
   <button className="button button-red" type="submit" disabled={!valid}>Проверить на официальном портале ↗</button>
  </form>
  {valid?<p className="court-source">Подготовленный адрес: <output>{value}</output></p>:null}
  {copied==='copied'?<p role="status">Адрес скопирован. На открывшемся сайте выберите улицу из подсказок и введите номер дома отдельно, если этого требует форма.</p>:null}
  {copied==='manual'?<p role="status">Не удалось скопировать адрес автоматически — скопируйте его из строки выше.</p>:null}
  <p className="court-source">Номер квартиры и ФИО вводить не требуется. Совпадение адреса с районом не устанавливает родовую, альтернативную или исключительную подсудность.</p>
 </div>;
}
