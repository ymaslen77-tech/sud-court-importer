'use client';

import {useMemo,useState} from 'react';

type Kind='complaint'|'fee-relief';
type Draft={
 applicant:string;address:string;email:string;phone:string;date:string;
 actIssuer:string;actIdentification:string;actPublication:string;challengedProvision:string;
 constitutionArticles:string;caseHistory:string;courtDecisions:string;
 exhaustionExplanation:string;deadlineExplanation:string;legalArguments:string;
 attachments:string;feeAmount:string;feeReasons:string;financialEvidence:string;
 requestedTerms:string;
};
type Field={key:keyof Draft;label:string;hint?:string;multiline?:boolean;required?:boolean};
const INITIAL:Draft={
 applicant:'',address:'',email:'',phone:'',date:'',
 actIssuer:'',actIdentification:'',actPublication:'',challengedProvision:'',
 constitutionArticles:'',caseHistory:'',courtDecisions:'',
 exhaustionExplanation:'',deadlineExplanation:'',legalArguments:'',
 attachments:'',feeAmount:'',feeReasons:'',financialEvidence:'',
 requestedTerms:''
};
const PERSON:Field[]=[
 {key:'applicant',label:'Фамилия, имя, отчество заявителя',required:true},
 {key:'address',label:'Почтовый адрес заявителя',required:true},
 {key:'email',label:'Электронная почта (при наличии)'},
 {key:'phone',label:'Контактный телефон (при наличии)'},
 {key:'date',label:'Дата подписания документа',hint:'Например: 29.10.2026',required:true}
];
const COMPLAINT:Field[]=[
 {key:'actIssuer',label:'Орган, принявший оспариваемый акт, и его адрес',required:true,multiline:true},
 {key:'actIdentification',label:'Название, дата, номер нормативного акта',required:true,multiline:true},
 {key:'actPublication',label:'Официальный источник опубликования акта',required:true},
 {key:'challengedProvision',label:'Конкретная статья, часть, пункт оспариваемого акта',required:true},
 {key:'constitutionArticles',label:'Статьи Конституции РФ и затронутые права',required:true,multiline:true},
 {key:'caseHistory',label:'Как оспариваемая норма была применена в вашем деле',required:true,multiline:true},
 {key:'courtDecisions',label:'Судебные акты: суд, дата, номер дела, результат',required:true,multiline:true},
 {key:'exhaustionExplanation',label:'Как исчерпаны внутригосударственные средства судебной защиты',required:true,multiline:true},
 {key:'deadlineExplanation',label:'Почему соблюдён годичный срок (или применимо исключение)',required:true,multiline:true},
 {key:'legalArguments',label:'Почему норма противоречит Конституции РФ: юридические доводы',required:true,multiline:true},
 {key:'attachments',label:'Приложения: перечислите документы, каждый с новой строки',required:true,multiline:true}
];
const FEE:Field[]=[
 {key:'challengedProvision',label:'Укажите предмет связанной конституционной жалобы',required:true,multiline:true},
 {key:'feeAmount',label:'Подлежащая уплате пошлина по проверенной ставке (рубли)',required:true},
 {key:'feeReasons',label:'Обстоятельства, препятствующие уплате пошлины',required:true,multiline:true},
 {key:'financialEvidence',label:'Доказательства имущественного положения',required:true,multiline:true},
 {key:'requestedTerms',label:'Условия просьбы: сумма после уменьшения, срок отсрочки или график рассрочки',hint:'Для освобождения можно оставить поле пустым',multiline:true},
 {key:'attachments',label:'Приложения: каждый документ с новой строки',required:true,multiline:true}
];
const VALUE=(value:string)=>value.trim()||'[НЕ ЗАПОЛНЕНО — ПРОВЕРИТЬ]';
function lines(value:string){
 const entries=value.split('\n').map(v=>v.trim()).filter(Boolean);
 return entries.length?entries.map((item,index)=>String(index+1)+'. '+item).join('\n'):'[СПИСОК ПРИЛОЖЕНИЙ НЕ ЗАПОЛНЕН]';
}
function draftText(kind:Kind,d:Draft,request:'nonconstitutional'|'meaning',relief:'exempt'|'reduce'|'defer'|'instalments'){
 const header=[
  'В Конституционный Суд Российской Федерации',
  '190000, г. Санкт-Петербург, Сенатская площадь, д. 1',
  'Заявитель: '+VALUE(d.applicant),
  'Адрес: '+VALUE(d.address),
  d.email.trim()?'Электронная почта: '+d.email.trim():null,
  d.phone.trim()?'Телефон: '+d.phone.trim():null
 ].filter(Boolean).join('\n');
 if(kind==='complaint'){
  const requestText=request==='nonconstitutional'?
   'Проверить конституционность положения '+VALUE(d.challengedProvision)+' и признать его не соответствующим Конституции Российской Федерации в обоснованном в жалобе объёме.':
   'Проверить конституционность положения '+VALUE(d.challengedProvision)+' и выявить его конституционно-правовой смысл, исключающий описанное в жалобе истолкование, противоречащее Конституции Российской Федерации.';
  return [
   'ПРОЕКТ ДОКУМЕНТА — ПРОВЕРЬТЕ ФАКТЫ И ПРАВОВЫЕ ОСНОВАНИЯ ПЕРЕД ПОДПИСАНИЕМ',
   header,'',
   'ЖАЛОБА',
   'на нарушение конституционных прав нормативным актом','',
   '1. Оспариваемый нормативный акт',
   'Орган, принявший акт, и его адрес: '+VALUE(d.actIssuer),
   'Акт (дата, номер, полное наименование): '+VALUE(d.actIdentification),
   'Источник официального опубликования: '+VALUE(d.actPublication),
   'Оспариваемая норма: '+VALUE(d.challengedProvision),'',
   '2. Применение нормы в конкретном деле',
   VALUE(d.caseHistory),
   'Судебные решения: '+VALUE(d.courtDecisions),'',
   '3. Условия допустимости жалобы',
   'Исчерпание внутригосударственных средств судебной защиты: '+VALUE(d.exhaustionExplanation),
   'Соблюдение срока обращения: '+VALUE(d.deadlineExplanation),'',
   '4. Конституционные права и правовое обоснование',
   'Нормы Конституции РФ: '+VALUE(d.constitutionArticles),
   VALUE(d.legalArguments),'',
   'Основание обращения: статьи 36–38, 96–97 Федерального конституционного закона от 21.07.1994 № 1-ФКЗ.',
   '5. ПРОШУ:',
   requestText,'',
   '6. Приложения:',
   lines(d.attachments),
   'Дополнительно проверить: текст оспариваемого акта, копии судебных решений, документ об уплате пошлины или соответствующее ходатайство, документы о представителе (если есть), необходимую дополнительную копию для бумажной подачи.','',
   'Дата: '+VALUE(d.date),
   'Подпись заявителя: __________________ /'+VALUE(d.applicant)+'/','',
   'Справочная форма не подтверждает допустимость жалобы и не заменяет юридическую проверку по ФКЗ № 1-ФКЗ.'
  ].join('\n');
 }
 const reliefText={
  exempt:'Освободить меня от уплаты государственной пошлины по приложенной конституционной жалобе.',
  reduce:'Уменьшить государственную пошлину с указанного размера на следующих условиях: '+VALUE(d.requestedTerms)+'.',
  defer:'Предоставить отсрочку уплаты государственной пошлины на следующих условиях: '+VALUE(d.requestedTerms)+'.',
  instalments:'Предоставить рассрочку уплаты государственной пошлины по следующему графику: '+VALUE(d.requestedTerms)+'.'
 }[relief];
 return [
  'ПРОЕКТ ДОКУМЕНТА — ПРОВЕРЬТЕ ФАКТЫ И ДОКАЗАТЕЛЬСТВА ПЕРЕД ПОДПИСАНИЕМ',
  header,'',
  'ХОДАТАЙСТВО',
  'по вопросу уплаты государственной пошлины','',
  'Вместе с настоящим ходатайством подаётся конституционная жалоба по вопросу: '+VALUE(d.challengedProvision)+'.',
  'Размер пошлины, подлежащий проверке по действующим нормам и реквизитам: '+VALUE(d.feeAmount)+' рублей.','',
  'Обстоятельства имущественного положения:',
  VALUE(d.feeReasons),'',
  'Подтверждающие документы и факты:',
  VALUE(d.financialEvidence),'',
  'Руководствуясь пунктом 3 статьи 333.23 Налогового кодекса Российской Федерации, статьями 39 ФКЗ № 1-ФКЗ и 333.41 НК РФ (для отсрочки или рассрочки),',
  'ПРОШУ:',
  reliefText,'',
  'Приложения:',
  lines(d.attachments),'',
  'Дата: '+VALUE(d.date),
  'Подпись заявителя: __________________ /'+VALUE(d.applicant)+'/','',
  'Справочная форма не гарантирует удовлетворения ходатайства; обстоятельства и приложения проверяются судом.'
 ].join('\n');
}
export function ConstitutionalDocumentGenerator({kind}:{kind:Kind}){
 const [data,setData]=useState<Draft>(INITIAL);
 const [request,setRequest]=useState<'nonconstitutional'|'meaning'>('nonconstitutional');
 const [relief,setRelief]=useState<'exempt'|'reduce'|'defer'|'instalments'>('exempt');
 const [feedback,setFeedback]=useState('');
 const fields=[...PERSON,...(kind==='complaint'?COMPLAINT:FEE)];
 const missing=fields.filter(f=>f.required&&!data[f.key].trim());
 const text=useMemo(()=>draftText(kind,data,request,relief),[kind,data,request,relief]);
 const canExport=missing.length===0&&(kind==='complaint'||relief==='exempt'||Boolean(data.requestedTerms.trim()));
 function change(key:keyof Draft,value:string){
  setData(old=>({...old,[key]:value}));
  setFeedback('');
 }
 async function copyDraft(){
  if(!canExport)return;
  try{
   await navigator.clipboard.writeText(text);
   setFeedback('Текст проекта скопирован. Проверьте его перед использованием.');
  }catch{
   setFeedback('Не удалось скопировать автоматически. Выделите текст проекта вручную.');
  }
 }
 function downloadDraft(){
  if(!canExport)return;
  const blob=new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=kind==='complaint'?'ksrf-complaint-draft.txt':'ksrf-fee-motion-draft.txt';
  document.body.appendChild(a);a.click();a.remove();
  URL.revokeObjectURL(url);
  setFeedback('Текстовый файл проекта сформирован в браузере. Проверьте его содержание и форму подачи.');
 }
 return <div className="ksrf-document-generator">
  <p className="ksrf-generator-notice"><strong>Черновик, не готовая к подаче жалоба.</strong> Данные остаются в памяти этой вкладки: форма не отправляет их на сервер и не сохраняет автоматически. После закрытия вкладки они могут быть потеряны. Не вводите лишние конфиденциальные сведения.</p>
  <form onSubmit={event=>event.preventDefault()}>
   <fieldset><legend>Заявитель</legend><div className="ksrf-generator-fields">
    {PERSON.map(field=><label key={field.key}>{field.label}{field.required?' *':''}
     <input type={field.key==='email'?'email':'text'} value={data[field.key]}
      onChange={event=>change(field.key,event.target.value)} placeholder={field.hint||''} autoComplete="off"/>
    </label>)}
   </div></fieldset>
   {kind==='complaint'?<fieldset><legend>Какое решение вы просите вынести</legend>
    <label><input type="radio" checked={request==='nonconstitutional'} onChange={()=>setRequest('nonconstitutional')}/> Признание конкретного положения не соответствующим Конституции РФ</label>
    <label><input type="radio" checked={request==='meaning'} onChange={()=>setRequest('meaning')}/> Выявление конституционно-правового смысла положения</label>
   </fieldset>:<fieldset><legend>Какую льготу по госпошлине просите</legend>
    {([['exempt','Освобождение'],['reduce','Уменьшение размера'],['defer','Отсрочка'],['instalments','Рассрочка']] as const).map(([id,label])=>
      <label key={id}><input type="radio" checked={relief===id} onChange={()=>setRelief(id)}/> {label}</label>)}
   </fieldset>}
   <fieldset><legend>{kind==='complaint'?'Содержание конституционной жалобы':'Основания ходатайства'}</legend>
    <div className="ksrf-generator-fields">
     {(kind==='complaint'?COMPLAINT:FEE).map(field=><label key={field.key}>
       {field.label}{field.required?' *':''}
       {field.multiline?<textarea rows={field.key==='legalArguments'?7:4} value={data[field.key]} onChange={event=>change(field.key,event.target.value)} placeholder={field.hint||''}/>:
       <input type="text" value={data[field.key]} onChange={event=>change(field.key,event.target.value)} placeholder={field.hint||''}/>}
     </label>)}
    </div>
   </fieldset>
  </form>
  <div className="ksrf-generator-status" role="status" aria-live="polite">
   {missing.length>0?<p><strong>Для экспорта заполните обязательные поля: {missing.length}.</strong> В предварительном тексте пустые поля помечены как незаполненные.</p>:null}
   {kind==='fee-relief'&&relief!=='exempt'&&!data.requestedTerms.trim()?<p><strong>Укажите конкретные условия просьбы.</strong> Для уменьшения — желаемую сумму, для отсрочки — срок, для рассрочки — график.</p>:null}
   {!missing.length&&canExport?<p>Обязательные поля заполнены, но факты, юридические основания и приложения ещё требуют индивидуальной проверки.</p>:null}
  </div>
  <section className="ksrf-generator-preview" aria-label="Предварительный текст документа">
   <h2>Предпросмотр документа</h2>
   <pre>{text}</pre>
  </section>
  <div className="ksrf-generator-actions">
   <button type="button" disabled={!canExport} onClick={copyDraft}>Копировать проект</button>
   <button type="button" disabled={!canExport} onClick={downloadDraft}>Скачать TXT</button>
   <button type="button" disabled={!canExport} onClick={()=>window.print()}>Печать / сохранить PDF</button>
   <button type="button" onClick={()=>{setData(INITIAL);setFeedback('Поля очищены.');}}>Очистить форму</button>
  </div>
  {feedback?<p className="ksrf-generator-feedback" role="status">{feedback}</p>:null}
  <aside className="ksrf-generator-sources">
   <strong>Перед подписанием проверьте первоисточники:</strong>
   <a href="https://www.ksrf.ru/Petition/PrimerOfStructure.php" target="_blank" rel="noopener noreferrer">Примерная структура жалобы</a>
   <a href="https://www.ksrf.ru/Petition/CommonComplaintQ.php" target="_blank" rel="noopener noreferrer">Официальные вопросы и ответы</a>
   <a href="https://www.ksrf.ru/about/legalbases/FCLM/Article37.php" target="_blank" rel="noopener noreferrer">Статья 37 ФКЗ № 1-ФКЗ</a>
   <a href="https://www.ksrf.ru/about/legalbases/FCLM/Article38.php" target="_blank" rel="noopener noreferrer">Статья 38 ФКЗ № 1-ФКЗ</a>
   {kind==='fee-relief'?<a href="https://www.ksrf.ru/about/legalbases/FCLM/Article39.php" target="_blank" rel="noopener noreferrer">Статья 39 и госпошлина</a>:<a href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Самопроверка допустимости на сайте суда</a>}
  </aside>
 </div>;
}
