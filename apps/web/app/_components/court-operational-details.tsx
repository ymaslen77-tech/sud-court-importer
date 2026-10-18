import dossiers from '../lib/research-dossiers.json';
import hours from '../lib/research-hours.json';
import departments from '../lib/pilot-department-contacts.json';
import facts from '../lib/pilot-practical-source-facts.json';

type Hours={office_hours:string;source_url:string;research_checked_on:string;current_verified:boolean};
type Dossier={offices:{label:string;address:string;hours:string;source_url:string}[];staff_observations:{name:string;position:string;source_url:string}[];payments:{source_url:string;source_updated_on:string|null;rows:{label:string;value:string}[];warning:string};reception:{description:string;source_url:string}};
type Department={source_url:string;departments:{label:string;phone:string}[]};
type Facts={source_url:string;items:{category:string;title:string;description:string}[]};
const allHours=hours as Record<string,Hours>;
const allDossiers=dossiers as Record<string,Dossier>;
const allDepartments=departments as Record<string,Department>;
const allFacts=facts as Record<string,Facts>;

function allowedSource(value:string):boolean {
 try {
  const url=new URL(value);
  return url.protocol==='https:' && url.username==='' && url.password==='' && url.port==='' &&
   (url.hostname==='sudrf.ru'||url.hostname.endsWith('.sudrf.ru'));
 } catch{return false;}
}
function Source({url,label}:{url:string;label:string}){
 return allowedSource(url)?<a href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>:null;
}
export function CourtOperationalDetails({code}:{code:string}) {
 const schedule=allHours[code],dossier=allDossiers[code],department=allDepartments[code],fact=allFacts[code];
 const buildingCount=dossier?.offices?.length??0;
 const departmentCount=dossier?.departments?.length??department?.departments?.length??0;
 const source=dossier?.reception?.source_url??fact?.source_url;
 const accessible=fact?.items.filter(x=>/доступност|маломобильн|пребывани|посещени/i.test(x.category+' '+x.title+' '+x.description))??[];
 const sourceCount=Number(Boolean(schedule))+Number(Boolean(dossier))+Number(Boolean(department))+Number(Boolean(fact));
 if(!sourceCount)return null;
 return <section id="pilot-operations" className="court-section">
   <span className="eyebrow">Подготовка к обращению · сведения и ограничения</span>
   <h2>Приём, канцелярии, доступность и оплата</h2>
   <p>Все опубликованные сведения собраны на странице суда. Ниже видно, какая информация уже имеется, а какие
    детали необходимо дополнительно подтвердить. Это помогает не перепутать общий рабочий график с часами приёма
    конкретного отдела и не использовать устаревшие реквизиты.</p>
   <div className="court-practical-grid">
     <article>
      <h3>Рабочее время и приёмная</h3>
      {schedule?<><p><strong>Общий режим из публикации:</strong> {schedule.office_hours}.</p>
       <p className="court-source">Отдельное подтверждение актуальных часов каждой канцелярии отсутствует.
        <Source url={schedule.source_url} label="Официальный график"/></p></>:
       <p>Отдельный официальный график работы пока не внесён в карточку. Не назначайте визит по предполагаемым часам.</p>}
      {dossier?.reception?<p><strong>Порядок приёма из публикации:</strong> {dossier.reception.description}
       {' '}<Source url={dossier.reception.source_url} label="Регламент приёма"/></p>:
       <p>Индивидуальные часы приёма документов и личного приёма руководства ещё требуют проверки.</p>}
     </article>
     <article>
      <h3>Отделы, архив и здания</h3>
      <p>На странице размещено служебных контактов подразделений: <strong>{departmentCount}</strong>.
       {departmentCount===0?' Детальный справочник отделов пока не подтверждён.':''}</p>
      <p>{buildingCount>0?'Описано зданий и постоянных присутствий: '+buildingCount+'.':
       'Отдельный подтверждённый реестр дополнительных зданий и судебных присутствий пока отсутствует.'}</p>
      <p className="court-source">Наличие телефонного номера в официальном справочнике не подтверждает работу линии в день обращения.</p>
     </article>
     <article>
      <h3>Доступность здания</h3>
      {accessible.length>0?<><p>В официальных публикациях упоминаются правила посещения или материалы
       о доступности здания: {accessible.map(x=>x.title).join('; ')}.</p>
       <Source url={fact.source_url} label="Публикация суда"/></>:
       <p>Проверенная схема доступного входа, лифта, пандуса и сопровождения маломобильных посетителей
        пока не включена. До посещения уточните условия и помощь в приёмной суда.</p>}
      <p className="court-source">Наличие инструкции не является подтверждением конкретного доступного маршрута.</p>
     </article>
     <article>
      <h3>Государственная пошлина и другие платежи</h3>
      {dossier?.payments?.rows?.length?<p>В архивной официальной публикации имеются {dossier.payments.rows.length}
       {' '}платёжных показателей{dossier.payments.source_updated_on?
        ' (редакция '+dossier.payments.source_updated_on+')':''}. Их нельзя считать действующей квитанцией.</p>:
       <p>Полные индивидуальные банковские реквизиты не подтверждены для этой карточки.</p>}
      <p>Перед перечислением денег проверьте получателя, КБК, ОКТМО, счёт, назначение платежа и льготы.
       Депозитный счёт суда нельзя использовать вместо реквизитов госпошлины.</p>
      {dossier?.payments?.source_url?<Source url={dossier.payments.source_url} label="Официальная платёжная публикация"/>:null}
     </article>
     <article>
      <h3>Судьи и действующие полномочия</h3>
      {dossier?.staff_observations?.length?
       <p>В ранее опубликованном официальном справочнике упомянуто сотрудников или судей:
        {' '}{dossier.staff_observations.length}. Подтверждение действующих полномочий и актуального состава отдельно не завершено.</p>:
       <p>Подтверждённый на текущую дату по актам о назначении персональный состав пока не внесён.</p>}
      <p className="court-source">Историческое упоминание ФИО не следует выдавать за действующее назначение.</p>
     </article>
   </div>
   <p className="court-source">Раздел не заменяет официальный порядок обращения и не меняет родовую или
    территориальную подсудность. {source?<Source url={source} label="Уточнить сведения у суда"/>:null}</p>
  </section>;
}
