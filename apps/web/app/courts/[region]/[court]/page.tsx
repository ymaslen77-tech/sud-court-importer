import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getCourt,safeOfficialUrl,type CourtDetail} from '../../../lib/api';
import {VerifiedCourtMap} from '../../../_components/verified-court-map';
import {findCategory} from '../../../lib/court-taxonomy';

type Props={params:Promise<{region:string;court:string}>};
export const dynamic='force-dynamic';

function formatted(date:string){
 const d=new Date(date);
 return Number.isNaN(d.getTime())?'Дата не указана':d.toLocaleDateString('ru-RU',{timeZone:'UTC'});
}
function currentEvidence(c:CourtDetail){
 const latest=new Date(c.verified_at).getTime();
 const isRecent=Number.isFinite(latest) && Date.now()-latest<=180*24*3600*1000 && latest<=Date.now();
 return Boolean(c.address&&c.official_url&&safeOfficialUrl(c.source_url)&&isRecent);
}
const labels:Record<string,string>={
 reception_hours:'Часы приёма граждан',office_hours:'Режим работы',
 filing_instructions_url:'Подача документов',jurisdiction_url:'Территориальная подсудность',
 bank_details_url:'Реквизиты и госпошлина',accessibility:'Доступная среда',transport:'Как добраться'
};
const changes:Record<string,string>={
 name:'Название суда',address:'Адрес',phone:'Телефон',email:'Электронная почта',
 official_url:'Официальный сайт',office_hours:'Режим работы',reception_hours:'Часы приёма',
 transport:'Транспорт',accessibility:'Доступная среда'
};

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const p=await params;
 try{
  const c=await getCourt(p.region,p.court);
  if(!c)return {title:'Суд не найден',robots:{index:false,follow:true}};
  const path='/courts/'+encodeURIComponent(p.region)+'/'+encodeURIComponent(p.court);
  const enriched=c.address?' Адрес: '+c.address+'.':'';
  return {
   title:c.name+' — официальный адрес, телефон, судьи и подсудность',
   description:(c.name+'. Контакты суда и проверенные сведения.'+enriched+
      ' Источники и дата обновления данных.').slice(0,290),
   alternates:{canonical:path},
   robots:{index:currentEvidence(c),follow:true},
   openGraph:{title:c.name,description:'Проверенные данные суда и официальный первоисточник',type:'website',url:path}
  };
 }catch{return {title:'Сведения о суде',robots:{index:false,follow:true}};}
}

export default async function CourtPage({params}:Props){
 const p=await params;
 const court=await getCourt(p.region,p.court);
 if(!court)notFound();
 const website=safeOfficialUrl(court.official_url);
 const source=safeOfficialUrl(court.source_url);
 const kind=findCategory(court.court_kind);
 const extra=court.fields.filter(f=>f.field_name in labels);
 const hasPhoto=court.photo&&/^\/court-media\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp)$/.test(court.photo.image_path)&&safeOfficialUrl(court.photo.source_url)&&safeOfficialUrl(court.photo.license_url);
 const geoAge=court.coordinate_verified_at
   ?Date.now()-new Date(court.coordinate_verified_at).getTime():Number.POSITIVE_INFINITY;
 const trustedGeo=court.coordinates&&safeOfficialUrl(court.coordinate_source_url)&&geoAge>=0
   &&geoAge<=180*24*3600*1000;
 const publicUrl=process.env.PUBLIC_SITE_URL;
 const canSchema=publicUrl?.startsWith('https://')&&currentEvidence(court);
 const canonical=canSchema?new URL('/courts/'+p.region+'/'+p.court,publicUrl).toString():null;
 const schema=canonical?{
   '@context':'https://schema.org','@type':'Courthouse',name:court.name,
   url:canonical,
   ...(court.address?{address:{'@type':'PostalAddress',streetAddress:court.address,
       addressRegion:court.region_name,addressCountry:'RU'}}:{}),
   ...(court.phone?{telephone:court.phone}:{}),
   ...(website?{sameAs:website}:{}),
   ...(trustedGeo?{geo:{'@type':'GeoCoordinates',latitude:court.coordinates!.latitude,
     longitude:court.coordinates!.longitude}}:{})
 }:null;
 return <>
  {schema?<script type="application/ld+json" dangerouslySetInnerHTML={{
    __html:JSON.stringify(schema).replace(/</g,'\\u003c')
  }}/>:null}
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
    <Link href="/courts">Суды России</Link><span>/</span>
    <Link href={'/courts/'+encodeURIComponent(p.region)}>{court.region_name}</Link><span>/</span>{court.name}</div>

  <section className="section-hero">
    <span className="kicker">Справочная карточка судебного органа</span>
    <h1>{court.name}</h1>
    <p className="lead">{court.court_type}{court.region_name?' · '+court.region_name:''}</p>
    <div className="notice"><span className="notice-dot" aria-hidden="true"/>
      Основные сведения сверены: {formatted(court.verified_at)}.
      {currentEvidence(court)?'':' Некоторые данные требуют повторной проверки.'}
    </div>
    {kind?<p className="court-kind-link"><Link href={'/courts/types/'+kind.slug}>{kind.title} ↗</Link></p>:null}
  </section>

  <div className="court-detail-grid">
    <section className="detail-card">
      <span className="eyebrow">Контакты и местоположение</span>
      <h2>Адрес и телефоны суда</h2>
      <dl className="court-facts">
        <div><dt>Адрес</dt><dd>{court.address??'Официальный адрес пока не подтверждён'}</dd></div>
        <div><dt>Телефон</dt><dd>{court.phone??'Нет подтверждённых данных'}</dd></div>
        <div><dt>Электронная почта</dt><dd>{court.email??'Нет подтверждённых данных'}</dd></div>
        <div><dt>Дата сверки</dt><dd>{formatted(court.verified_at)}</dd></div>
      </dl>
      {website?<a className="button button-dark" href={website} target="_blank" rel="noopener noreferrer">Официальный сайт суда ↗</a>:null}
      {source?<p className="court-source"><a href={source} target="_blank" rel="noopener noreferrer">Официальный источник карточки ↗</a></p>:null}
    </section>
    <aside className="detail-card detail-side">
      <span className="eyebrow">Фасад здания</span>
      <h2>Как выглядит суд</h2>
      {hasPhoto?<figure className="court-photo">
         <img src={court.photo!.image_path} loading="lazy" alt={'Фасад здания: '+court.name}/>
         <figcaption>Фото: {court.photo!.author}. {court.photo!.license_name}.
          {' '}<a href={court.photo!.source_url} target="_blank" rel="noopener noreferrer">Источник ↗</a>
          {' '}<a href={court.photo!.license_url} target="_blank" rel="noopener noreferrer">Лицензия ↗</a>
         </figcaption>
       </figure>:<div className="media-unavailable">Подтверждённое изображение фасада пока не добавлено. Фотографии публикуются только с установленными правами использования.</div>}
    </aside>
  </div>

  <section className="court-section">
    <span className="eyebrow">Как добраться</span>
    <h2>Расположение суда на карте</h2>
    {trustedGeo
      ?<VerifiedCourtMap latitude={court.coordinates!.latitude} longitude={court.coordinates!.longitude}
        sourceUrl={court.coordinate_source_url}/>
      :<div className="empty-state">Точные координаты ещё не проверены. Карта будет доступна после сверки местоположения по официальному источнику.</div>}
  </section>

  <section className="court-section">
    <span className="eyebrow">Практическая информация</span><h2>График, подача документов и подсудность</h2>
    {extra.length?<div className="court-evidence-grid">{extra.map(entry=>{
      const href=entry.field_name.endsWith('_url')?safeOfficialUrl(entry.value):null;
      return <article key={entry.field_name} className="evidence-item">
        <h3>{labels[entry.field_name]}</h3>
        <p>{href?<a href={href} rel="noopener noreferrer" target="_blank">Открыть официальный раздел ↗</a>:entry.value}</p>
        <small>{Date.now()-new Date(entry.verified_at).getTime()>90*24*3600*1000?'Требует повторной проверки (':'Проверено '}
          {formatted(entry.verified_at)}{Date.now()-new Date(entry.verified_at).getTime()>90*24*3600*1000?')':''}
        {' · '}<a target="_blank" rel="noopener noreferrer" href={entry.source_url}>Источник ↗</a></small>
      </article>;
    })}</div>:<div className="empty-state">Дополнительные сведения проходят проверку. Перед поездкой уточните часы приёма, порядок подачи документов и подсудность на официальном сайте суда.</div>}
  </section>

  <section className="court-section">
    <span className="eyebrow">Судейский состав</span><h2>Судьи и должности</h2>
    {court.judges.length?<div className="judge-verified-list">{court.judges.map((judge,i)=><article key={judge.full_name+'-'+judge.position+'-'+i}>
      <h3>{judge.full_name}</h3><p>{judge.position}</p>
      <small>{judge.starts_on?'Начало полномочий: '+judge.starts_on+' · ':''}
        <a href={judge.source_url} rel="noopener noreferrer" target="_blank">Официальный источник назначения ↗</a></small>
    </article>)}</div>:<div className="empty-state">Персональный состав суда ещё не подтверждён. Указание должности или ФИО без действующего источника не допускается.</div>}
  </section>

  <section className="court-section">
    <span className="eyebrow">История и достоверность</span><h2>Что изменилось в сведениях о суде</h2>
    {court.changes.length?<ol className="court-changes">{court.changes.map((change,i)=><li key={change.occurred_at+'-'+i}>
      <strong>{changes[change.changed_field]??change.changed_field}</strong>
      <span>{formatted(change.occurred_at)}</span>
      <p>{change.old_value??'Ранее не указано'} → {change.new_value??'Не указано'}</p>
    </li>)}</ol>:<div className="empty-state">Зафиксированных опубликованных изменений пока нет. Это не означает, что сведения никогда не менялись.</div>}
    <p className="court-source">Изменения сначала сверяются с первоисточником; обнаружение обновления сайта не меняет карточку автоматически.</p>
  </section>

  <section className="callout">
    <div><span className="eyebrow">Дополнительные разделы</span>
      <h2>Дела, судебные акты и обращения</h2>
      <p>Сведения о делах и судебной практике будут связаны с карточкой после проверки опубликованных актов. Сервис не является официальной электронной приёмной.</p></div>
    <div className="callout-links"><Link href="/practice">Судебная практика →</Link>
      <Link href="/jurisdiction">Определение подсудности →</Link>
      <Link href="/sources">Методология источников →</Link></div>
  </section>
 </>;
}
