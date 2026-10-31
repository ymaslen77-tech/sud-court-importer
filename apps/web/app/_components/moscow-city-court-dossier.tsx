import Link from 'next/link';
import type {MoscowOfficialMinimumCourt} from '../lib/moscow-official-minimum';
import {
 MGS_BASE,MGS_GUIDE_TOPICS,MGS_OFFICIAL,mgsGuideHref
} from '../lib/moscow-city-court-guide';
import {mgsSeoStructuredData} from '../lib/moscow-city-seo';

export function MoscowCityCourtDossier({court}:{court:MoscowOfficialMinimumCourt}){
 const structured=mgsSeoStructuredData('Московский городской суд — подсудность, дела, адрес и контакты','Московский городской суд: адрес, контакты, подсудность, поиск дел, подача документов и апелляции.',MGS_BASE);
 const firstSteps=[
  {slug:'jurisdiction',number:'01',name:'Проверьте адрес',desc:'Установите районный суд по полному адресу в официальном сервисе.'},
  {slug:'competence',number:'02',name:'Определите инстанцию',desc:'Проверьте, относится ли дело к компетенции Мосгорсуда, а не районного или другого суда.'},
  {slug:'filing',number:'03',name:'Подготовьте обращение',desc:'Выберите правильный процессуальный способ подачи и проверьте необходимые приложения.'}
 ];
 return <article className="moscow-minimum-court-page">
  {structured?<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>:null}
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Суды Москвы</Link><span>/</span>{court.name}
  </nav>
  <section className="section-hero">
   <span className="kicker">Москва · суд города федерального значения · расширенное досье</span>
   <h1>Московский городской суд</h1>
   <p className="lead">Компетенция и апелляции, проверка подсудности по адресу, реальные контакты и здания, поиск дел, пошлина и подача документов — в одном понятном справочнике.</p>
   <div className="notice" role="note">
    Независимый справочник: сведения сверены с официальными материалами на 31 октября 2026 года.
    Индивидуальная актуальность адресов, режима канцелярий и телефонов не подтверждена повторно непосредственно перед посещением.
    По конкретному делу учитывайте судебное извещение и действующие процессуальные нормы.
   </div>
   <nav className="court-toc" aria-label="Разделы Московского городского суда">
    <strong>Восемь подробных разделов</strong>
    {MGS_GUIDE_TOPICS.map(topic=><Link key={topic.slug} href={mgsGuideHref(topic.slug)}>{topic.shortTitle}</Link>)}
   </nav>
  </section>
  <section className="court-section" id="mgs-first-three">
   <span className="eyebrow">Рекомендуемый маршрут из трёх внутренних страниц</span>
   <h2>Сначала разобраться в вопросе — затем переходить к действиям</h2>
   <p>По образцу подробного маршрута Конституционного Суда мы собрали восемь собственных справочных разделов. Для определения нужного суда полезно пройти три ключевых этапа. Это рекомендация, а не ограничение доступа к официальным источникам.</p>
   <ol className="ksrf-guide-list">{firstSteps.map(step=><li key={step.slug}>
    <span>{step.number}</span>
    <div><h3><Link href={mgsGuideHref(step.slug)}>{step.name} →</Link></h3>
     <p>{step.desc}</p></div>
   </li>)}</ol>
  </section>
  <section className="court-section" id="mgs-contacts">
   <span className="eyebrow">Сверенные основные сведения</span>
   <h2>Где находится суд, куда писать и кому звонить</h2>
   <dl className="court-facts">
    <div><dt>Основное здание и адрес почты</dt><dd>Москва, улица Богородский Вал, дом 8</dd></div>
    <div><dt>Отдельное помещение</dt><dd>Москва, улица Фридриха Энгельса, дом 32, строение 1 — первая инстанция по отдельным уголовным и административным делам, согласно официальной странице контактов.</dd></div>
    <div><dt>Экспедиция / делопроизводство</dt><dd>+7 (495) 533-83-10</dd></div>
    <div><dt>Общая горячая линия</dt><dd>+7 (499) 530-08-08</dd></div>
    <div><dt>Электронная почта</dt><dd>{court.email} — не для процессуальной подачи</dd></div>
    <div><dt>Рабочее время</dt><dd>Пн–чт 09:00–18:00; пт 09:00–16:45; сб–вс выходные. Графики отделов уточняйте отдельно.</dd></div>
   </dl>
   <div className="notice" role="note">
    <strong>Уточните почтовый индекс перед отправкой.</strong>
    В исходном официальном каталоге указан индекс 107076, а на подробной официальной странице «Контакты и часы приёма» — 107996.
    Адрес улицы и дома совпадает, но нельзя автоматически признать один из индексов верным.
    Для корреспонденции официальный сайт направляет на Богородский Вал, 8.
   </div>
   <p className="court-source"><Link href={mgsGuideHref('contacts')}>Узнать, какое здание и отдел нужны →</Link></p>
  </section>
  <section className="court-section" id="mgs-jurisdiction">
   <span className="eyebrow">Официальная проверка адреса</span>
   <h2>Как определить подсудность по адресу в Москве</h2>
   <p>Официальный поиск определяет территориальную подсудность районным судам Москвы. Введите улицу, дом, корпус и строение при наличии; система поможет установить районный суд. Не путайте его с Московским городским судом, который рассматривает отдельные дела первой инстанции и апелляции.</p>
   <div className="court-filter-actions">
    <Link className="button button-red" href={mgsGuideHref('jurisdiction')}>Проверка подсудности: инструкция →</Link>
    <a className="button button-outline" href={MGS_OFFICIAL.territory} target="_blank" rel="noopener noreferrer">Официальный сервис подсудности ↗</a>
   </div>
   <p className="court-source">При заполнении не нужны квартира и персональные данные. Точный номер дома, корпус и строение имеют значение.</p>
  </section>
  <section className="court-section" id="mgs-all-topics">
   <span className="eyebrow">Внутренняя библиотека · 8 страниц</span>
   <h2>Подробное досье по всем основным вопросам</h2>
   <div className="court-practical-grid">{MGS_GUIDE_TOPICS.map((topic,i)=><article key={topic.slug}>
    <span className="eyebrow">Раздел {String(i+1).padStart(2,'0')}</span>
    <h3>{topic.shortTitle}</h3><p>{topic.lead}</p>
    <Link className="text-link" href={mgsGuideHref(topic.slug)}>Открыть справочный раздел →</Link>
   </article>)}</div>
  </section>
  <section className="court-section" id="mgs-sources">
   <span className="eyebrow">Прямой доступ к первоисточникам</span>
   <h2>Официальные сведения</h2>
   <p>Все первоисточники открываются напрямую. Внутренние страницы помогают разобраться, но не ограничивают проверку на официальном портале.</p>
   <ul>
    <li><a href={MGS_OFFICIAL.court} target="_blank" rel="noopener noreferrer">Официальная карточка Московского городского суда ↗</a></li>
    <li><a href={MGS_OFFICIAL.contacts} target="_blank" rel="noopener noreferrer">Адреса, часы приёма и контакты ↗</a></li>
    <li><a href={MGS_OFFICIAL.competence} target="_blank" rel="noopener noreferrer">Официальная компетенция суда ↗</a></li>
    <li><a href={MGS_OFFICIAL.territory} target="_blank" rel="noopener noreferrer">Проверка территориальной подсудности ↗</a></li>
    <li><a href={MGS_OFFICIAL.cases} target="_blank" rel="noopener noreferrer">Поиск по судебным делам ↗</a></li>
   </ul>
   <p className="court-source">Фото, биографии судей и тексты судебных актов не копируем без проверки актуальности, прав на материалы и законности публикации.</p>
  </section>
  <section className="section-wrap"><h2>Другие суды Москвы</h2>
   <p><Link className="text-link" href="/courts/moscow">Перейти к справочнику 36 московских судов →</Link></p>
  </section>
 </article>;
}
