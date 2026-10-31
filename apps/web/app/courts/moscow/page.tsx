import Link from 'next/link';
import type {Metadata} from 'next';
import {moscowCourts} from '../../lib/moscow-courts';
import {MOSCOW_DISTRICT_INDIVIDUALS} from '../../lib/moscow-district-individual';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS,MoscowOfficialCourtHref,MOSCOW_DIRECTORY_META} from '../../lib/moscow-official-minimum';
import {regionalArbitrationCourts,regionalArbitrationHref} from '../../lib/regional-arbitration';

export const metadata:Metadata={
 title:'Суды Москвы — городской и 35 районных судов: адреса, часы работы, контакты',
 description:'Справочник районных судов Москвы по официальному порталу: 35 районных судов и Московский городской суд, адреса, общий режим работы, электронная почта и источники.',
 robots:{index:false,follow:true},alternates:{canonical:'/courts/moscow'}
};
export default function MoscowDirectory(){
 const district=MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>c.kind==='general-district');
 const city=MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>c.kind==='general-regional');
 const rich=moscowCourts();
 const individualSet=new Set(MOSCOW_DISTRICT_INDIVIDUALS.map(c=>c.slug));
 const arbitration=regionalArbitrationCourts('moscow');
 return <>
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span>Москва
  </nav>
  <section className="section-hero">
   <span className="kicker">Москва · официальный справочный реестр</span>
   <h1>Суды Москвы: адреса, график работы и контакты</h1>
   <p className="lead">Московский городской суд и все 35 районных судов, перечисленных на официальном портале судов общей юрисдикции Москвы. Для каждого указаны адрес, общий режим работы, почта и источник.</p>
   <div className="moscow-registry-summary">
    <div><strong>{MOSCOW_OFFICIAL_MINIMUM_COURTS.length}</strong><span>Судебных органов в перечне</span></div>
    <div><strong>{district.length}</strong><span>Районных судов</span></div>
    <div><strong>{rich.length+individualSet.size}</strong><span>Районных карточек с индивидуальным наполнением</span></div>
   </div>
   <div className="notice" role="note">
    Справочник основан на официальной публикации, но не заменяет проверку актуальных адресов и часов конкретных канцелярий.
    Дата обновления официального районного перечня — 29.05.2026. Мировые судьи, арбитражные и военные суды учитываются в отдельных источниках.
    Ни одна запись не признана автоматически юридически проверенной только за наличие в каталоге.
   </div>
   <nav className="court-toc" aria-label="Содержание">
    <strong>Разделы</strong>
    <a href="#moscow-city">Московский городской суд</a>
    <a href="#moscow-district">35 районных судов</a>
    <a href="#moscow-arbitration">Арбитражные суды</a>
    <a href="#moscow-sources">Источники и другие виды судов</a>
   </nav>
  </section>
  <section className="section-wrap" id="moscow-city">
   <div className="section-intro"><span className="eyebrow">Общая юрисдикция</span><h2>Московский городской суд</h2></div>
   <div className="results">{city.map(c=><Link className="result-row moscow-registry-result" href={MoscowOfficialCourtHref(c)} key={c.slug}>
    <span><strong>{c.name}</strong><small>{c.address}</small>
     <small>{c.office_hours} · {c.email}</small>
     <small>Дополнительный адрес из официальной карты указан в карточке</small>
    </span><span aria-hidden="true">→</span>
   </Link>)}</div>
  </section>
  <section className="section-wrap" id="moscow-district">
   <div className="section-intro"><span className="eyebrow">Официальный перечень · {district.length} судов</span>
    <h2>Районные суды Москвы</h2>
    <p>Нажмите на суд, чтобы узнать его адрес и рабочее время. Для {rich.length} судов сохранены ранее разработанные расширенные досье; остальные {individualSet.size} получили индивидуальные сведения об официальных контактах, руководстве и сервисах. Непроверенные биографии и судебные дела не добавляются.</p>
   </div>
   <div className="results">{district.map(c=><Link className="result-row moscow-registry-result" href={MoscowOfficialCourtHref(c)} key={c.slug}>
    <span><strong>{c.name}</strong>
     {c.visitor_locations?.length?<small className="moscow-temporary-location"><strong>Временный адрес посещения:</strong> {c.visitor_locations[0].address} — подробности в карточке</small>:null}
     <small>{c.visitor_locations?.length?'Почтовый адрес: ':'Адрес: '}{c.address}</small>
     <small>Общий режим: {c.office_hours} · {c.email}</small>
     <small>{rich.some(x=>x.name.toLocaleLowerCase('ru').replace(/ё/g,'е').startsWith(c.name.toLocaleLowerCase('ru').replace(/ё/g,'е')))?'Есть подробная справочная карточка':individualSet.has(c.slug)?'Индивидуальная карточка по официальному источнику':'Базовая справочная карточка'}</small>
    </span><span aria-hidden="true">→</span>
   </Link>)}</div>
  </section>
  {arbitration.length>0?<section className="section-wrap" id="moscow-arbitration">
   <div className="section-intro"><span className="eyebrow">Отдельная судебная система</span>
    <h2>Арбитражные суды Москвы</h2>
    <p>Из существующего справочника арбитражных судов. Их нет в количестве 36 судов городского портала; сведения о конкретных контактах требуют отдельной официальной сверки.</p>
   </div>
   <div className="results">{arbitration.map(item=><Link className="result-row" key={item.slug} href={regionalArbitrationHref('moscow',item.slug)}>
    <span><strong>{item.courtName}</strong><small>Справочная запись · отдельная проверка</small></span><span aria-hidden="true">→</span>
   </Link>)}</div>
  </section>:null}
  <section className="section-wrap" id="moscow-sources">
   <h2>Первоисточники и другие категории</h2>
   <p>Каталог составлен по сведениям официального портала, источник перечня — <a href={MOSCOW_DIRECTORY_META.roster_url} target="_blank" rel="noopener noreferrer">список районных судов Москвы ↗</a> и <a href={MOSCOW_DIRECTORY_META.source_url} target="_blank" rel="noopener noreferrer">официальная карта с адресами и режимом работы ↗</a>.</p>
   <p>В нашем разделе <Link href="/courts/magistrates">«Мировые судьи»</Link> и <Link href="/courts/arbitration">«Арбитражные суды»</Link> используются отдельные реестры. Наличие информации на этом сайте не подтверждает текущий состав судей, адресную подсудность либо режим работы отдельных подразделений.</p>
  </section>
  <section className="callout"><div><h2>Нужно определить суд по адресу?</h2>
    <p>Для территориальной подсудности указывайте улицу и полный номер дома, корпус и строение. Название района или станция метро не гарантируют подсудность.</p>
   </div>
   <a className="text-link" href="https://mos-gorsud.ru/territorial" target="_blank" rel="noopener noreferrer">Официальная проверка подсудности ↗</a>
  </section>
 </>;
}
