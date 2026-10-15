import dossiers from '../lib/research-dossiers.json';

type Linked={source_url:string};
type Dossier={
 court_code:string;evidence_class:string;researched_on:string;summary:string;
 offices:(Linked&{label:string;address:string;hours:string})[];
 departments:(Linked&{label:string;phone:string;room:string|null})[];
 staff_observations:(Linked&{name:string;position:string})[];
 reception:Linked&{description:string};
 payments:{source_url:string;source_updated_on:string|null;warning:string;rows:{label:string;value:string}[]};
 official_services:{label:string;description:string;url:string}[];
 provenance:{label:string;url:string;last_modified:string|null}[];
 extra_emails?:string[];
};
const researchDossiers=dossiers as Record<string,Dossier>;

function officialSource(url:string):boolean{
 try{
  const x=new URL(url);
  return x.protocol==='https:' && !x.username && !x.password &&
    (x.hostname==='sudrf.ru'||x.hostname.endsWith('.sudrf.ru'));
 }catch{return false;}
}

export function ResearchDossier({code}:{code:string}){
 const record=researchDossiers[code];
 if(!record || code!==record.court_code ||
    record.evidence_class!=='official_page_observation_not_editorially_approved')return null;
 const links=[
   ...record.offices.map(x=>x.source_url),
   ...record.departments.map(x=>x.source_url),
   ...record.staff_observations.map(x=>x.source_url),
   record.reception.source_url,record.payments.source_url,
   ...record.official_services.map(x=>x.url),...record.provenance.map(x=>x.url)
 ];
 if(!links.every(officialSource))return null;
 return <>
   <section className="court-section" id="research-dossier">
     <span className="eyebrow">Официальные публикации · исследовательское досье</span>
     <h2>Подробная информация о суде</h2>
     <p>{record.summary}</p>
     <div className="notice" role="note">
       <span className="notice-dot" aria-hidden="true"/>
       Сведения исследованы {record.researched_on}, но не утверждены редактором как актуальные.
       Сверяйте их на сайте суда перед использованием.
     </div>
   </section>

   <section className="court-section" id="court-buildings">
     <span className="eyebrow">Где находится суд</span>
     <h2>Здания и постоянные судебные присутствия</h2>
     <div className="court-jurisdiction-guidance">
       {record.offices.map((office,i)=><article key={office.label+'-'+i}>
         <h3>{office.label}</h3>
         <p><strong>Адрес:</strong> {office.address}</p>
         <p><strong>График из публикации:</strong> {office.hours}</p>
         <p className="court-source"><a href={office.source_url} target="_blank" rel="noopener noreferrer">Официальный источник ↗</a></p>
       </article>)}
     </div>
   </section>

   <section className="court-section" id="court-contacts-detailed">
     <span className="eyebrow">Публичные номера служебных подразделений</span>
     <h2>Телефоны отделов и канцелярий</h2>
     <div className="court-department-grid">
       {record.departments.map((department,i)=><article key={department.label+'-'+i}>
         <h3>{department.label}</h3>
         <p className="court-phone">{department.phone}</p>
         {department.room?<p>Расположение: {department.room}</p>:null}
         <a href={department.source_url} target="_blank" rel="noopener noreferrer">Сверить телефон ↗</a>
       </article>)}
     </div>
     {record.extra_emails?.length?<p className="court-source">Дополнительная публичная почта из официального источника: {record.extra_emails.join(', ')}. Назначение ящика следует уточнить перед отправкой процессуальных документов.</p>:null}
   </section>

   <section className="court-section" id="court-visitor-reception">
     <span className="eyebrow">Обращение в суд</span>
     <h2>Приём граждан</h2>
     <p>{record.reception.description}</p>
     <p className="court-source"><a href={record.reception.source_url} rel="noopener noreferrer" target="_blank">Официальные правила приёма ↗</a></p>
   </section>

   <section className="court-section" id="court-online-services">
     <span className="eyebrow">Справочная информация и государственные сервисы</span>
     <h2>Документы, подсудность и судебные дела</h2>
     <div className="court-jurisdiction-guidance">
       {record.official_services.map((service,i)=><article key={service.label+'-'+i}>
         <h3>{service.label}</h3>
         <p>{service.description}</p>
         <p className="court-source"><a href={service.url} rel="noopener noreferrer" target="_blank">Перейти на официальный сайт ↗</a></p>
       </article>)}
     </div>
   </section>

   {record.staff_observations.length>0?<section className="court-section" id="court-staff-observations">
     <span className="eyebrow">Указаны в официальной публикации, полномочия требуют сверки</span>
     <h2>Руководство и состав суда</h2>
     <div className="court-department-grid">
       {record.staff_observations.map((person,i)=><article key={person.name+'-'+i}>
         <h3>{person.name}</h3><p>{person.position}</p>
         <p className="court-source"><a href={person.source_url} rel="noopener noreferrer" target="_blank">Проверить назначение на официальном сайте ↗</a></p>
       </article>)}
     </div>
     <p className="court-source">Наличие ФИО в опубликованной странице не доказывает действующие полномочия на дату обращения. Для утверждения требуется проверка актов о назначении.</p>
   </section>:null}

   <section className="court-section" id="court-fees">
     <span className="eyebrow">Платёжная информация</span>
     <h2>Государственная пошлина</h2>
     <p>{record.payments.warning}</p>
     <p><a className="text-link" href={record.payments.source_url} rel="noopener noreferrer" target="_blank">Актуальные реквизиты и калькулятор на сайте суда ↗</a></p>
     {record.payments.source_updated_on?<p className="court-source">Дата редакции исходной публикации: {record.payments.source_updated_on}. Платёжные счета и КБК не копируются в предварительную карточку, чтобы не направить средства по устаревшим реквизитам.</p>:null}
   </section>

   <section className="court-section" id="court-dossier-sources">
     <span className="eyebrow">Прозрачность источников</span>
     <h2>Откуда взяты дополнительные сведения</h2>
     <ul className="court-dossier-sources">{record.provenance.map((item,i)=><li key={item.url+'-'+i}>
       <a href={item.url} rel="noopener noreferrer" target="_blank">{item.label} ↗</a>
       <small>{item.last_modified?'Указанная дата изменения источника: '+item.last_modified:'Дата обновления документа не установлена'}</small>
     </li>)}</ul>
   </section>
 </>;
}
