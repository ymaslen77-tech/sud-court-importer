'use client';

import Link from 'next/link';
import {useMemo,useState} from 'react';
import {researchRegions} from '../lib/research-courts';
import {resolveAddressJurisdiction,type AddressRole,type CaseKind,type CourtLevel,type ResolverRequest} from '../lib/resolve-address-jurisdiction';

const groups=[
 {value:'civil',label:'Гражданское дело'},
 {value:'consumer',label:'Защита прав потребителя'},
 {value:'family',label:'Семейный спор'},
 {value:'property',label:'Спор о недвижимости'},
 {value:'economic',label:'Экономический спор'},
 {value:'other',label:'Другая категория / пока не определена'}
] as const;
const roles=[
 {value:'applicant',label:'Адрес заявителя (истца)'},
 {value:'defendant',label:'Адрес ответчика'},
 {value:'property',label:'Адрес спорной недвижимости'},
 {value:'other',label:'Другой адрес'}
] as const;
const levels=[
 {value:'unknown',label:'Не определён'},
 {value:'district',label:'Районный (городской) суд'},
 {value:'magistrate',label:'Мировой судья'},
 {value:'arbitration',label:'Арбитражный суд субъекта'}
] as const;

function legalNote(group:CaseKind,role:AddressRole):string {
 if(group==='property')return 'Исключительная подсудность по месту нахождения имущества действует для предусмотренных законом требований, но не для всех споров с недвижимостью.';
 if(group==='economic')return 'Сначала устанавливается компетенция арбитражного суда и применимость адреса ответчика либо специального правила.';
 if(group==='consumer')return 'Потребитель в предусмотренных законом случаях вправе выбрать суд по своему месту жительства, однако уровень суда зависит от требований.';
 if(role==='applicant')return 'Адрес истца не подходит для общего правила гражданского иска. Законные исключения требуют отдельной проверки.';
 return 'Одного адреса недостаточно: необходимо установить вид требований, судебную инстанцию и законную территориальную привязку.';
}

export function AddressJurisdictionSearch(){
 const [region,setRegion]=useState('');
 const [address,setAddress]=useState('');
 const [role,setRole]=useState<AddressRole>('defendant');
 const [caseKind,setCaseKind]=useState<CaseKind>('civil');
 const [courtLevel,setCourtLevel]=useState<CourtLevel>('unknown');
 const [submitted,setSubmitted]=useState<ResolverRequest|null>(null);
 const regions=useMemo(()=>researchRegions(),[]);
 const result=useMemo(()=>submitted?resolveAddressJurisdiction(submitted):null,[submitted]);
 const submit=()=>{
   setSubmitted({region,address:address.trim(),role,caseKind,courtLevel});
 };
 const valid=Boolean(region && address.trim().length>=3 && address.trim().length<=180);
 return <section className="court-address-tool" aria-labelledby="address-tool-title">
  <div className="section-intro">
   <span className="eyebrow">Строгое определение подсудности по официальным границам</span>
   <h2 id="address-tool-title">Найти один суд по точному адресу</h2>
   <p>Сервис больше не выбирает суд по совпадению названия города. Он показывает **только один суд**, когда существует проверенная территориальная привязка к конкретному адресу, подтверждённая действующим источником. Иначе результат блокируется с объяснением причины.</p>
  </div>
  <form className="court-address-form" onSubmit={event=>{event.preventDefault();submit();}}>
   <div className="court-filter-grid">
    <label>Регион
     <select value={region} onChange={e=>{setRegion(e.target.value);setSubmitted(null);}} required>
      <option value="">Выберите регион</option>
      {regions.map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}
     </select>
    </label>
    <label>Категория дела
     <select value={caseKind} onChange={e=>{setCaseKind(e.target.value as CaseKind);setSubmitted(null);}}>
      {groups.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
     </select>
    </label>
    <label>Чей адрес используется
     <select value={role} onChange={e=>{setRole(e.target.value as AddressRole);setSubmitted(null);}}>
      {roles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
     </select>
    </label>
    <label>Уровень суда (родовая подсудность)
     <select value={courtLevel} onChange={e=>{setCourtLevel(e.target.value as CourtLevel);setSubmitted(null);}}>
      {levels.map(level=><option key={level.value} value={level.value}>{level.label}</option>)}
     </select>
    </label>
    <label className="filter-full">Точный адрес без персональных данных
     <input value={address} maxLength={180} autoComplete="off" required
      placeholder="Например: Новосибирская область, город Новосибирск, улица Ленина, дом 5"
      onChange={e=>{setAddress(e.target.value);setSubmitted(null);}}/>
    </label>
   </div>
   <p className="court-form-hint">Укажите населённый пункт, улицу и номер дома. Не вводите номер квартиры, ФИО и другие персональные данные. Адрес проверяется в браузере: не отправляется в API, не сохраняется и не попадает в URL.</p>
   <button className="button button-red" type="submit" disabled={!valid}>Определить один суд →</button>
  </form>
  <div className="court-legal-notice" role="note">
   <strong>Условие юридической точности</strong>
   <p>{legalNote(caseKind,role)} Даже точное попадание адреса в географические границы не заменяет определение родовой, альтернативной или исключительной подсудности.</p>
  </div>
  {result?<div className="court-address-results" aria-live="polite" data-resolution={result.kind}>
   {result.kind==='resolved'?<>
    <h3>Определён один суд</h3>
    <div className="results"><Link className="result-row" href={result.courtUrl}>
      <span><strong>{result.courtName}</strong>
       <small>Код: {result.courtCode}. Подтверждение адресной границы: {result.reviewedOn}</small>
       <small>Результат получен по проверенному адресному правилу, не по совпадению названия населённого пункта</small>
      </span><span aria-hidden="true">↗</span>
    </Link></div>
    <p className="court-source">Официальный источник правила: <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">проверить территорию ↗</a></p>
   </>:<>
    <h3>Суд не определён</h3>
    <p><strong>{result.reason}</strong></p>
    <p>{result.hint}</p>
    <p className="court-source">Результаты не показываются, потому что назначение суда нельзя достоверно установить по имеющимся данным. Код диагностики: <code>{result.code}</code>. Отсутствие результата не означает, что суд по данному адресу не существует.</p>
   </>}
  </div>:null}
 </section>;
}
