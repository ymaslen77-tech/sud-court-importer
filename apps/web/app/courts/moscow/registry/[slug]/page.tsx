import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {
 MOSCOW_OFFICIAL_MINIMUM_COURTS,getMoscowOfficialMinimumCourt,
 officialMoscowCourtKindLabel,MoscowOfficialCourtHref
} from '../../../../lib/moscow-official-minimum';

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
 return MOSCOW_OFFICIAL_MINIMUM_COURTS.map(x=>({slug:x.slug}));
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const court=getMoscowOfficialMinimumCourt(slug);
 if(!court)return {title:'Суд не найден',robots:{index:false,follow:false}};
 return {
  title:court.name+' — адрес, часы работы и контакты, Москва',
  description:court.name+': '+court.address+'. Расписание и контакты из официального каталога московских судов.',
  alternates:{canonical:'/courts/moscow/registry/'+court.slug},
  robots:{index:false,follow:true}
 };
}
export default async function MoscowOfficialRegistryDetail({params}:Props){
 const {slug}=await params;
 const court=getMoscowOfficialMinimumCourt(slug);
 if(!court)notFound();
 const detailed=MoscowOfficialCourtHref(court);
 const hasRich=detailed!==('/courts/moscow/registry/'+court.slug);
 const related=MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>c.slug!==court.slug&&c.kind===court.kind).slice(0,5);
 return <article className="moscow-minimum-court-page">
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Суды Москвы</Link><span>/</span>{court.name}
  </nav>
  <section className="section-hero">
   <span className="kicker">Москва · официальный справочный перечень</span>
   <h1>{court.name}</h1>
   <p className="lead">{officialMoscowCourtKindLabel(court)}. Адрес, опубликованный график работы и контактные сведения по официальному московскому справочнику.</p>
   <div className="notice" role="note">
    Это независимая справочная запись. Список судов опубликован в официальном каталоге,
    но индивидуальная актуальность адресов, режима канцелярий и телефонов на день посещения
    не подтверждена повторно. Режим конкретного отдела, судей и приём граждан уточняйте отдельно.
   </div>
   <nav className="court-toc" aria-label="Содержание">
    <strong>На странице</strong>
    <a href="#contacts">Адрес и контакты</a>
    <a href="#practical">Как пользоваться сведениями</a>
    <a href="#source">Официальные источники</a>
   </nav>
  </section>
  <section className="court-section" id="contacts">
   <span className="eyebrow">Справочная запись</span>
   <h2>Адрес, график работы, контакты</h2>
   {court.visitor_locations?.length?<div className="notice" role="note">
    <strong>Внимание: временные помещения суда</strong>
    <p>{court.location_notice}</p>
    <ul>{court.visitor_locations.map(location=><li key={location.label}>
      <strong>{location.label}:</strong> {location.address}
    </li>)}</ul>
    {court.location_notice_url?<p><a href={court.location_notice_url} target="_blank" rel="noopener noreferrer">Официальное сообщение о переносе ↗</a></p>:null}
   </div>:null}
   <dl className="court-facts">
    <div><dt>Суд</dt><dd>{court.name}</dd></div>
    <div><dt>Вид</dt><dd>{officialMoscowCourtKindLabel(court)}</dd></div>
    <div><dt>{court.visitor_locations?.length?'Адрес для почтовой корреспонденции':'Адрес из официального каталога'}</dt><dd>{court.address}</dd></div>
    {court.other_locations.length>0?<div><dt>Другие точки из официальной карты</dt><dd>
     {court.other_locations.map(location=><p key={location.address}>{location.address}. {location.note}.</p>)}
    </dd></div>:null}
    <div><dt>Опубликованный общий режим</dt><dd>{court.office_hours}</dd></div>
    {court.lunch?<div><dt>Перерыв в официальном справочнике</dt><dd>{court.lunch}</dd></div>:null}
    <div><dt>Общая справочная линия московских судов</dt><dd>{court.general_hotline}</dd></div>
    <div><dt>Электронная почта</dt><dd><a href={'mailto:'+court.email}>{court.email}</a></dd></div>
    {court.metro?<div><dt>Метро, указанное в справочнике</dt><dd>{court.metro}</dd></div>:null}
   </dl>
   <p className="court-source">Обычная электронная почта не заменяет предусмотренный процессуальными правилами способ подачи документов.</p>
  </section>
  <section className="court-section" id="practical">
   <span className="eyebrow">Перед обращением</span>
   <h2>Как подготовиться к посещению</h2>
   <ol className="ksrf-guide-list">
    <li><span>01</span><div><h3>Уточните подсудность</h3><p>Адрес суда и место рассмотрения дела не определяют сами по себе, подсудно ли ему ваше обращение. Сверьте вид дела и территориальные правила.</p></div></li>
    <li><span>02</span><div><h3>Проверьте часы конкретного подразделения</h3><p>Часы общего режима не означают работу архива, экспедиции и приёмной весь указанный интервал.</p></div></li>
    <li><span>03</span><div><h3>Проверьте извещение по делу</h3><p>Заседание может проходить в отдельном или временном помещении; актуальное место указывается в официальном извещении.</p></div></li>
    <li><span>04</span><div><h3>Подготовьте документы</h3><p>Возьмите удостоверение личности, номер дела, извещение и документы о полномочиях представителя при необходимости.</p></div></li>
   </ol>
   <div className="court-filter-actions">
    <Link className="button button-red" href="/courts/moscow">Все 36 судов московского справочника →</Link>
    {hasRich?<Link className="button button-outline" href={detailed}>Подробное досье этого суда →</Link>:null}
   </div>
  </section>
  <section className="court-section" id="source">
   <span className="eyebrow">Происхождение сведений</span>
   <h2>Официальный источник и ограничения</h2>
   <p>Источник сведений: официальный портал судов общей юрисдикции города Москвы.
    В каталоге указан режим работы и адрес здания. Общий реестр районных судов обновлён
    29 мая 2026 года. Публикация данных на нашем сайте не означает текущего подтверждения
    каждого контактного поля.</p>
   <p><a href={court.source_url} target="_blank" rel="noopener noreferrer">Открыть официальную карту судов Москвы ↗</a></p>
   <p><a href="https://mos-gorsud.ru/rs" target="_blank" rel="noopener noreferrer">Официальный перечень районных судов ↗</a></p>
   <p>В отдельном разделе <Link href="/courts/magistrates">мировых судей</Link> и в каталоге
    <Link href="/courts/arbitration"> арбитражных судов</Link> используются другие официальные
    реестры. Они не включены в число 36 органов этого источника.</p>
  </section>
  {related.length?<section className="section-wrap"><h2>Другие московские суды</h2>
   <div className="results">{related.map(item=><Link key={item.slug} className="result-row"
      href={MoscowOfficialCourtHref(item)}><span><strong>{item.name}</strong>
      <small>{item.address}</small></span><span aria-hidden="true">→</span></Link>)}</div>
  </section>:null}
 </article>;
}
