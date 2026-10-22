import Link from 'next/link';
import type {CourtDossierData,OfficialFact,CourtPerson} from '../lib/court-rich-records';
import {findRegion} from '../lib/regions';
import {CourtDossierCompleteness} from './court-dossier-completeness';
import {judgeForName,judgeProfileHref} from '../lib/judge-dossiers';

function Ref({url}:{url:string}){
 return <a className="court-source" href={url} target="_blank" rel="noopener noreferrer">Официальный источник ↗</a>;
}
function FactList({items}:{items:OfficialFact[]}){
 return <div className="court-evidence-grid">{items.map((f,i)=><article className="evidence-item" key={i}>
  <p><strong>{f.value}</strong></p>
  {f.note?<p>{f.note}</p>:null}
  <small><Ref url={f.source}/></small>
 </article>)}</div>;
}
function Roster({people}:{people:CourtPerson[]}){
 return <div className="judge-verified-list">{people.map((p,i)=><article key={p.name+'-'+i}>
  <h3>{judgeForName(p.name)?<Link href={judgeProfileHref(judgeForName(p.name)!)}>{p.name} →</Link>:p.name}</h3><p>{p.role}</p>
  {p.appointment?<p>{p.appointment}</p>:null}
  <small><Ref url={p.source}/></small>
 </article>)}</div>;
}

export function CourtRichDossier({court}:{court:CourtDossierData}){
 const regionName=findRegion(court.region)?.name??court.region;
 const judgeSource=court.serviceLinks.find(x=>x.label==='Состав суда');
 const filing=court.serviceLinks.find(x=>x.label==='Подача процессуальных документов');
 const cases=court.serviceLinks.find(x=>x.label==='Судебное делопроизводство и поиск дела');
 const fee=court.serviceLinks.find(x=>x.label==='Реквизиты и калькулятор госпошлины');
 const juris=court.serviceLinks.find(x=>x.label==='Территориальная подсудность');
 const mapQuery=encodeURIComponent(court.addresses[1]?.value??court.addresses[0]?.value??court.name);
 const casesNotice=court.notes.find(x=>x.section==='Судебные дела и заседания');
 const jurisdictionNotice=court.notes.find(x=>x.section==='Подсудность по точному адресу');
 return <>
 <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
  <Link href="/courts">Суды России</Link><span>/</span>
  <Link href={'/courts/'+court.region}>{regionName}</Link><span>/</span>{court.name}</div>
 <section className="section-hero">
  <span className="kicker">Развёрнутое справочное досье · официальные источники</span>
  <h1>{court.name}</h1>
  <p className="lead">{court.kind} · {regionName}</p>
  <div className="notice" role="note">Дата проверки доступных официальных публикаций: {court.observedOn}.
   Состав судей приведён по официальной публикации{court.judgesPublished?' от '+court.judgesPublished:''}, телефонный справочник — по публикации{court.contactsPublished?' от '+court.contactsPublished:''}.
   Это не подтверждение отсутствия более поздних изменений. Для процессуальных действий сверяйте актуальность на официальном сайте.</div>
  <p><a className="button button-dark" href={court.officialUrl} target="_blank" rel="noopener noreferrer">Официальный сайт суда ↗</a></p>
 </section>
 <CourtDossierCompleteness withSources={[
  'identity','contacts','judges','staff','magistrates','filing','fees','sources'
 ]}/>
 <nav className="court-toc" aria-label="Разделы карточки суда">
  <strong>Содержание досье</strong>
  <a href="#rich-identity">Паспорт</a>
  <a href="#rich-addresses">Здания и контакты</a>
  <a href="#rich-judges">Судьи и назначение</a>
  <a href="#rich-staff">Аппарат суда</a>
  <a href="#rich-hours">Режим работы</a>
  <a href="#rich-jurisdiction">Подсудность</a>
  <a href="#rich-magistrates">Мировые судьи</a>
  <a href="#rich-filing">Подача документов</a>
  <a href="#rich-cases">Дела и заседания</a>
  <a href="#rich-fees">Госпошлина</a>
  <a href="#rich-map">Карта и доступность</a>
  <a href="#rich-sources">Источники</a>
 </nav>
 <div className="court-identity" id="rich-identity">
  <div><strong>Наименование</strong><span>{court.name}</span></div>
  <div><strong>Вид</strong><span>{court.kind}</span></div>
  <div><strong>Регион</strong><span>{regionName}</span></div>
  <div><strong>Дата изучения</strong><span>{court.observedOn} · актуальность отдельных данных уточняется</span></div>
 </div>
 <section id="rich-addresses" className="court-section">
  <span className="eyebrow">Адреса и службы</span>
  <h2>Здания, телефоны и электронная почта</h2>
  <h3>Адреса суда: {court.addresses.length}</h3>
  <FactList items={court.addresses}/>
  <h3>Контактные телефоны по подразделениям</h3>
  <FactList items={court.phones}/>
  <h3>Официальный e-mail</h3>
  <FactList items={court.emails}/>
 </section>
 <section id="rich-judges" className="court-section">
  <span className="eyebrow">Состав суда из официальной публикации</span>
  <h2>Судьи и основания назначения · {court.judges.length}</h2>
  <p>Ниже сохранён состав из официальной публикации{court.judgesPublished?', изменённой '+court.judgesPublished:''}.
  Наличие ФИО в историческом перечне не доказывает полномочия на текущую дату. Известные судьи имеют отдельные справочные досье с источниками; состав из сохранённой выборки не является полным актуальным списком.</p>
  <Roster people={court.judges}/>
  {judgeSource?<p><a href={judgeSource.url} target="_blank" rel="noopener noreferrer">Сверить опубликованный состав ↗</a></p>:null}
 </section>
 <section id="rich-staff" className="court-section">
  <span className="eyebrow">Подразделения и должностные лица</span>
  <h2>Аппарат суда · {court.staff.length} должностных лиц</h2>
  <p>Перечень руководителей подразделений по официальному телефонному справочнику; это не полный штат.</p>
  <Roster people={court.staff}/>
 </section>
 <section id="rich-hours" className="court-section">
  <span className="eyebrow">Практический приём</span><h2>График работы и выдача документов</h2>
  <p>График приёма, работы канцелярий, ознакомления с делами, архива и выдачи актов требует отдельной актуальной публикации. Не подменяем его графиком со стороннего справочника.</p>
  <a href={court.officialUrl} target="_blank" rel="noopener noreferrer">Проверить режим работы приёмной на официальном сайте ↗</a>
 </section>
 <section id="rich-jurisdiction" className="court-section">
  <span className="eyebrow">Предметная и территориальная компетенция</span>
  <h2>Какие дела рассматривает суд и какие адреса обслуживает</h2>
  <p>Компетенция конкретного суда определяется его видом, уровнем судебной системы и действующим процессуальным законом. Район расположения объекта или заявителя сам по себе не гарантирует территориальную подсудность.</p>
  <p>{jurisdictionNotice?.message??'Точная уличная и домовая подсудность требует проверки по действующему официальному источнику.'}</p>
  {juris?<p><a href={juris.url} target="_blank" rel="noopener noreferrer">Официальный раздел территориальной подсудности ↗</a></p>:null}
  <p><Link href="/jurisdiction">Правила определения подсудности →</Link></p>
 </section>
 <section id="rich-magistrates" className="court-section">
  <span className="eyebrow">Связанные судебные участки</span>
  <h2>Мировые судьи судебного района</h2>
  <p>Номера участков из официальной публикации. Персональный состав мировых судей, адреса участков и границы их территорий проверяются отдельно.</p>
  {court.magistrateUnits.length?<div className="results">{court.magistrateUnits.map(x=><a className="result-row" key={x.number}
    href={x.url} target="_blank" rel="noopener noreferrer"><span><strong>Судебный участок № {x.number}</strong><small>Официальный перечень и территория обслуживания</small></span><span>↗</span></a>)}</div>:<p>Связанные судебные участки ещё не подтверждены официальными документами.</p>}
 </section>
 <section id="rich-filing" className="court-section">
  <span className="eyebrow">Инструкция заявителю</span>
  <h2>Как подать иск, заявление или жалобу</h2>
  <ol>
   <li>Определите вид судопроизводства и проверьте предметную и территориальную подсудность.</li>
   <li>Выберите процессуальный документ, проверьте подпись, полномочия и обязательные приложения.</li>
   <li>Проверьте госпошлину, льготы и способы подтверждения уплаты по действующему законодательству.</li>
   <li>Подайте документы через официальную электронную систему либо допустимым бумажным способом. Обычная электронная почта не заменяет процессуальную подачу.</li>
   <li>Сохраните подтверждение подачи и отслеживайте номер и движение дела в официальном источнике.</li>
  </ol>
  {filing?<p><a className="button button-dark" href={filing.url} target="_blank" rel="noopener noreferrer">Электронная подача через ГАС «Правосудие» ↗</a></p>:null}
 </section>
 <section id="rich-cases" className="court-section">
  <span className="eyebrow">Судебное делопроизводство</span>
  <h2>Поиск дела, судебные акты и заседания</h2>
  <p>Ищите дело на официальном портале по номеру, виду производства и другим доступным параметрам. {casesNotice?.message??'Проверенные индивидуальные дела и расписание заседаний пока не подключены; не подставляем вымышленные номера, залы и судей.'}</p>
  {cases?<p><a href={cases.url} target="_blank" rel="noopener noreferrer">Официальная система поиска дел ↗</a></p>:null}
  <p>Публикация судебных актов зависит от правил ограничения доступа и обезличивания. Отсутствие записи на сайте не означает, что дела нет.</p>
 </section>
 <section id="rich-fees" className="court-section">
  <span className="eyebrow">Оплата и документы</span>
  <h2>Государственная пошлина, реквизиты и льготы</h2>
  <p>Размер пошлины зависит от предмета требования, категории заявителя и действующих норм НК РФ; расчёт выполняется отдельно для конкретного обращения. Устаревшие реквизиты и фиксированные суммы не копируются.</p>
  {fee?<p><a href={fee.url} target="_blank" rel="noopener noreferrer">Официальный калькулятор и реквизиты ↗</a></p>:null}
 </section>
 <section id="rich-map" className="court-section">
  <span className="eyebrow">Местоположение</span>
  <h2>Карта, проезд и доступность здания</h2>
  <p>Адресов в исходных сведениях: {court.addresses.length}. Карта открывает поиск по адресу и не удостоверяет конкретный вход или корпус. Перед посещением уточняйте назначение здания по телефону.</p>
  <p><a href={'https://yandex.ru/maps/?text='+mapQuery} target="_blank" rel="noopener noreferrer">Открыть адрес в Яндекс Картах ↗</a></p>
  <p>Доступность входа, лифта, парковки и условий посещения маломобильными гражданами требует самостоятельной проверки.</p>
 </section>
 <section id="rich-sources" className="court-section">
  <span className="eyebrow">Контроль достоверности</span>
  <h2>Источники, дата публикации и незакрытые проверки</h2>
  <p>Основа — доступные официальные публикации, включая состав суда и контакты, если они имеются. Даты публикаций могут отличаться от даты посещения портала.</p>
  <ul>{court.serviceLinks.map(x=><li key={x.url+x.label}>
   <a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>
   {x.note?<span> — {x.note}</span>:null}
  </li>)}</ul>
  <h3>Сведения, требующие дополнительной проверки</h3>
  <ul>{court.notes.map(x=><li key={x.section}><strong>{x.section}:</strong> {x.message} <Ref url={x.source}/></li>)}</ul>
 </section>
 <section className="callout"><div><h2>Суды {regionName}</h2>
  <p>Вернитесь в каталог региона или откройте поиск по другим видам суда.</p></div>
  <div className="callout-links"><Link href={'/courts/'+court.region}>Каталог региона →</Link>
  <Link href="/courts">Все суды России →</Link></div></section>
 </>;
}
