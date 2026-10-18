'use client';
import {useState,type FormEvent} from 'react';
type LeadType='question'|'callback';
export function MoscowLeadCapture({slug,courtName,enabled,privacyUrl,variant}:{slug:string;courtName:string;enabled:boolean;privacyUrl:string|null;variant:LeadType}){
 const [fullName,setFullName]=useState('');
 const [contact,setContact]=useState('');
 const [topic,setTopic]=useState('Подсудность');
 const [message,setMessage]=useState('');
 const [consent,setConsent]=useState(false);
 const [honeypot,setHoneypot]=useState('');
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<'sent'|'error'|null>(null);
 const title=variant==='callback'?'Запросить обратный звонок по вопросу обращения в суд':'Задать вопрос о суде и подготовке документов';
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!enabled||!consent||busy)return;
  setBusy(true);setResult(null);
  try{
   const res=await fetch('/api/court-leads',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({slug,fullName,contact,topic,message,consent,honeypot,requestType:variant})});
   setResult(res.status===202?'sent':'error');
   if(res.status===202){setMessage('');setContact('');setFullName('');setConsent(false);}
  }catch{setResult('error');}
  finally{setBusy(false);}
 }
 return <section className="court-section moscow-lead-panel" id={'msk-lead-'+variant}>
  <span className="eyebrow">Независимая юридическая справочная помощь · не является приёмной суда</span>
  <h2>{title}</h2>
  <p>Вопрос относится к {courtName}. Это запрос оператору информационного проекта, <strong>не обращение в суд</strong>; процессуальные документы следует подавать только по установленному порядку.</p>
  <form className="moscow-lead-form" onSubmit={submit}>
   <label>Какой вопрос вас интересует?
    <select value={topic} onChange={e=>setTopic(e.target.value)} disabled={!enabled}>
     {['Подсудность','Подача иска','Обжалование решения','Поиск судебного дела','Госпошлина','Подготовка документов','Другой вопрос'].map(x=><option key={x}>{x}</option>)}
    </select>
   </label>
   <label>Как к вам обращаться?
    <input autoComplete="name" required maxLength={80} value={fullName} onChange={e=>setFullName(e.target.value)} disabled={!enabled}/>
   </label>
   <label>Телефон или электронная почта для ответа
    <input autoComplete="email" required maxLength={130} value={contact} onChange={e=>setContact(e.target.value)} disabled={!enabled}/>
   </label>
   <label>Краткое описание вопроса (не указывайте персональные данные участников дел)
    <textarea rows={3} maxLength={400} value={message} onChange={e=>setMessage(e.target.value)} disabled={!enabled}/>
   </label>
   <label className="moscow-honey" aria-hidden="true">Не заполнять<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label>
   <label className="moscow-consent">
    <input type="checkbox" checked={consent} disabled={!enabled} onChange={e=>setConsent(e.target.checked)}/>
    <span>Я согласен на обработку предоставленных контактных данных для ответа на мой запрос.
    {privacyUrl?<a href={privacyUrl} target="_blank" rel="noopener noreferrer"> Политика обработки персональных данных ↗</a>:null}</span>
   </label>
   <button className="button button-red" type="submit" disabled={!enabled||!consent||busy}>
    {busy?'Отправка…':variant==='callback'?'Заказать обратный звонок':'Отправить вопрос'}
   </button>
   {!enabled?<p role="status" className="court-source">Приём заявок пока не подключён: требуется подтверждённый оператор персональных данных, опубликованная политика и безопасный обработчик запросов. Мы не собираем данные до настройки.</p>:null}
   {result==='sent'?<p role="status">Запрос принят обработчиком. Это не регистрация обращения в суд.</p>:null}
   {result==='error'?<p role="alert">Запрос не отправлен. Проверьте соединение или попробуйте позже.</p>:null}
  </form>
 </section>;
}
