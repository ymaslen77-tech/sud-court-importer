'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import {researchCourtsByRegion,researchRegions,type ResearchCourt} from '../lib/research-courts';

const groups=[
  {value:'civil',label:'Гражданское дело'},
  {value:'consumer',label:'Защита прав потребителя'},
  {value:'family',label:'Семейный спор'},
  {value:'property',label:'Спор о недвижимости'},
  {value:'economic',label:'Экономический спор'},
  {value:'other',label:'Другая категория'}
];
const roles=[
 {value:'applicant',label:'Адрес заявителя (истца)'},
 {value:'defendant',label:'Адрес ответчика'},
 {value:'property',label:'Адрес спорной недвижимости'},
 {value:'other',label:'Другой адрес'}
];
function normalize(s:string):string{
 return s.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/[^а-яa-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function locality(s:string):string{
 const m=/(?:^|,)\s*(?:г\.|город\s+|с\.|село\s+|рп\.|пгт\.|пос(?:елок|ёлок)?\s+)([^,]+)/i.exec(s);
 return normalize(m?.[1]??'');
}
function tokens(s:string):string[]{
 return normalize(s).split(' ').filter(word=>word.length>2 && !['город','область','район','край','улица','дом','корпус','поселок','россия','новосибирская','омская','хабаровский'].includes(word));
}
function candidateMatches(c:ResearchCourt, address:string):boolean{
 const normalizedAddress=normalize(address);
 const municipality=locality(c.address??'');
 const courtWords=tokens(c.name);
 const addressWords=new Set(tokens(address));
 const matchLocality=municipality.length>2 &&
   (' '+normalizedAddress+' ').includes(' '+municipality+' ');
 const matchCourtName=courtWords.some(w=>addressWords.has(w));
 return matchLocality || matchCourtName;
}

function legalNote(group:string,role:string):string{
 if(group==='property')return 'Для ряда требований о правах на недвижимое имущество действует исключительная подсудность по месту нахождения объекта (ст. 30 ГПК РФ).';
 if(group==='economic')return 'Экономические споры могут относиться к арбитражным судам. В общем случае иск к организации предъявляют по месту её нахождения (ст. 35 АПК РФ); предусмотрены исключения.';
 if(group==='consumer')return 'По искам о защите прав потребителей закон допускает выбор места предъявления иска, в том числе по месту жительства или пребывания истца, в случаях ст. 29 ГПК РФ.';
 if(role==='applicant')return 'По общему правилу гражданский иск предъявляется по месту жительства ответчика (ст. 28 ГПК РФ). Адрес истца подходит только в предусмотренных законом случаях.';
 if(role==='property')return 'Подсудность по адресу имущества зависит от вида спора. Не все споры с имуществом относятся к исключительной подсудности.';
 if(role==='defendant')return 'Адрес ответчика соответствует общему территориальному правилу для гражданских исков (ст. 28 ГПК РФ), но родовая подсудность и исключения требуют проверки.';
 return 'Адрес сам по себе не определяет суд: учитываются статус сторон, категория спора, договорная и исключительная подсудность.';
}
const visibleLimit=12;

export function AddressJurisdictionSearch(){
 const [region,setRegion]=useState('');
 const [address,setAddress]=useState('');
 const [role,setRole]=useState('applicant');
 const [caseGroup,setCaseGroup]=useState('civil');
 const [submitted,setSubmitted]=useState(false);
 const [showAll,setShowAll]=useState(false);
 const regions=researchRegions();
 const results=useMemo(()=>{
  if(!submitted||!region||normalize(address).length<3 ||
     caseGroup==='economic'||(caseGroup==='civil'&&role==='applicant'))return [];
  return researchCourtsByRegion(region).filter(c=>candidateMatches(c,address) && (!c.code.includes('MS') || caseGroup!=='economic'))
    .sort((a,b)=>{
       const district=a.code.includes('RS')?-1:0;
       const other=b.code.includes('RS')?-1:0;
       return district-other || a.name.localeCompare(b.name,'ru');
    });
 },[region,address,submitted,caseGroup,role]);
 const valid=Boolean(region&&normalize(address).length>=3&&normalize(address).length<=180);
 const noData=region==='region-27';
 return <section className="court-address-tool" aria-labelledby="address-tool-title">
   <div className="section-intro">
     <span className="eyebrow">Подбор по адресу · первичная навигация</span>
     <h2 id="address-tool-title">Найти суд по адресу</h2>
     <p>Подберите суды для проверки по населённому пункту и региону. Установление территориальной подсудности до улицы и дома пока недоступно: для этого нужны официальные границы судебных участков и районов.</p>
   </div>
   <form className="court-address-form" onSubmit={event=>{event.preventDefault();setSubmitted(true);setShowAll(false);}}>
     <div className="court-filter-grid">
       <label>Регион
         <select value={region} onChange={e=>{setRegion(e.target.value);setSubmitted(false);}} required>
           <option value="">Выберите регион</option>
           {regions.map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}
         </select>
       </label>
       <label>Категория обращения
         <select value={caseGroup} onChange={e=>{setCaseGroup(e.target.value);setSubmitted(false);}}>
           {groups.map(g=><option value={g.value} key={g.value}>{g.label}</option>)}
         </select>
       </label>
       <label>Чей адрес используется
         <select value={role} onChange={e=>setRole(e.target.value)}>
           {roles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
         </select>
       </label>
       <label className="filter-full">Адрес без персональных данных
         <input value={address} onChange={e=>{setAddress(e.target.value);setSubmitted(false);}}
           maxLength={180} required placeholder="Например: Новосибирская область, г. Барабинск, ул. Ленина, д. 5"
           autoComplete="off"/>
       </label>
     </div>
     <p className="court-form-hint">ФИО, квартиру и другие персональные данные не вводите. Поиск выполняется прямо в браузере, адрес не отправляется в API и не сохраняется.</p>
     <button className="button button-red" type="submit" disabled={!valid}>Подобрать суды для проверки →</button>
   </form>
   <div className="court-legal-notice" role="note">
     <strong>Правило подсудности</strong>
     <p>{legalNote(caseGroup,role)} Сначала нужно определить вид судопроизводства и уровень суда; только затем — территорию.</p>
   </div>
   {submitted?<div className="court-address-results" aria-live="polite">
     <h3>Результаты предварительного подбора</h3>
     {!valid?<p>Укажите регион и адрес длиной не менее трёх символов.</p>
     :caseGroup==='economic'?<p>Для экономических споров сначала необходимо определить компетенцию арбитражных судов по АПК РФ. Исследовательские карточки районных судов здесь намеренно не предлагаются. <Link href="/courts/arbitration">Перейти к арбитражным судам →</Link></p>
     :caseGroup==='civil'&&role==='applicant'?<p>По общему правилу гражданский иск подаётся по адресу ответчика, а не заявителя. Выберите «Адрес ответчика», либо уточните категорию дела и предусмотренное законом исключение (ст. 29–30 ГПК РФ).</p>
     :noData?<p>По данному региону есть предварительный список участков, но сведения о границах и адресах отсутствуют. Точное определение подсудности невозможно. <Link href={'/courts/'+region}>Посмотреть судебные участки →</Link></p>
     :results.length===0?<p>Однозначных совпадений по населённому пункту не найдено. Это не означает, что суд отсутствует. <Link href={'/courts/'+region}>Посмотреть суды выбранного региона →</Link></p>
     :<>
       <p>Найдено предварительных совпадений: <strong>{results.length}</strong>. Это совпадения по названию или населенному пункту, а не юридически подтверждённая подсудность улицы и дома.</p>
       <div className="results">{(showAll?results:results.slice(0,visibleLimit)).map(c=><Link className="result-row" key={c.code} href={'/courts/'+c.region+'/sud-'+c.code.toLowerCase()}>
         <span><strong>{c.name}</strong><small>{c.kind} · {c.address??'Адрес не указан'} · {c.code}</small>
           <small>Исследовательская карточка: территориальные границы требуют проверки</small></span>
         <span aria-hidden="true">↗</span>
       </Link>)}</div>
       {results.length>visibleLimit&&!showAll?<button className="button button-outline" type="button" onClick={()=>setShowAll(true)}>Показать остальные совпадения ({results.length-visibleLimit})</button>:null}
     </>}
     <p className="court-source">Проверяйте территориальную подсудность на <a href="https://sudrf.ru/" rel="noopener noreferrer" target="_blank">официальном портале ГАС «Правосудие» ↗</a> или сайте соответствующего суда. Результат не является процессуальным заключением.</p>
   </div>:null}
 </section>;
}
