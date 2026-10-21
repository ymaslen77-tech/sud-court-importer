import Link from 'next/link';
import type { Metadata } from 'next';
import { CourtSearch } from '../_components/court-search';
import { getRegions } from '../lib/api';
import { researchRegions } from '../lib/research-courts';
import {COURT_CATEGORIES} from '../lib/court-taxonomy';
import {pilotPublicCourts} from '../lib/pilot-public';
import {moscowCourts} from '../lib/moscow-courts';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  try {
    const regions = await getRegions();
    return { title: 'Каталог судов Российской Федерации', description: 'Справочные карточки судов с официальными источниками и отмеченной актуальностью сведений.', robots: { index: regions.length > 0 || pilotPublicCourts().length > 0, follow: true } };
  } catch {
    return { title: 'Каталог судов Российской Федерации', robots: { index: false, follow: true } };
  }
}
export default async function CourtsDirectory() {
  let regions: Awaited<ReturnType<typeof getRegions>> = [];
  let failed = false;
  try { regions = await getRegions(); } catch { failed = true; }
  const research = researchRegions();
  const pilot = pilotPublicCourts();
  const moscowCount=moscowCourts().length;
  const knownSlugs=new Set(['moscow',...research.map(item=>item.slug)]);
  const verifiedOthers=regions.filter(region=>!knownSlugs.has(region.slug));
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Суды России</div>
    <section className="section-hero">
      <span className="kicker">Судебная система РФ</span>
      <h1>Каталог судов России</h1>
      <p className="lead">Найдите суд по виду и региону, названию или официальному коду. Подтверждённые и предварительные сведения отображаются отдельно.</p>
      <CourtSearch compact />
    </section>
    <section className="section-wrap" id="court-regions" aria-labelledby="court-regions-title">
      <div className="section-intro with-action"><div>
        <span className="eyebrow">Каталог по регионам</span>
        <h2 id="court-regions-title">Выберите регион России</h2>
        <p>Откройте регион, затем конкретный суд. На его странице показываются доступные адрес, контакты, карта, состав судей и дела — только если эти сведения получены и проверены.</p>
      </div><Link className="text-link" href="/courts/coverage">Наполненность базы →</Link></div>
      <div className="region-grid court-region-directory">
        <Link className="region-item" href="/courts/moscow">
          <span><strong>Москва</strong><small>Районные суды · справочные досье</small></span>
          <small>{moscowCount} карточек</small><span aria-hidden="true">↗</span>
        </Link>
        {research.map(item=><Link className="region-item" key={item.slug} href={'/courts/'+item.slug}>
          <span><strong>{item.name}</strong><small>Предварительные сведения, ожидающие сверки</small></span>
          <small>{item.count} карточек</small><span aria-hidden="true">↗</span>
        </Link>)}
        {verifiedOthers.map(item=><Link className="region-item" key={item.slug} href={'/courts/'+item.slug}>
          <span><strong>{item.name}</strong><small>Опубликованные записи из базы проекта</small></span>
          <small>{item.court_count} карточек</small><span aria-hidden="true">↗</span>
        </Link>)}
      </div>
      <p className="court-source">Показаны только регионы, в которых уже есть данные. Это не полный реестр субъектов Российской Федерации. У предварительных карточек могут отсутствовать актуальные состав судей, карта или судебные дела.</p>
      {failed?<p className="court-source" role="status">Подтверждённая база сейчас недоступна; выше остаются доступными справочные региональные списки.</p>:null}
      <div className="court-filter-actions">
        <Link className="button button-red" href="/search?region=moscow&kind=general-district">Показать районные суды Москвы →</Link>
        <Link className="text-link" href="/search">Искать суд по виду, региону и названию ↗</Link>
      </div>
    </section>
    <section className="section-wrap taxonomy-section">
      <div className="section-intro with-action"><div>
        <span className="eyebrow">Навигация по судебной системе</span>
        <h2>Виды судов России</h2>
        <p>Мировые судьи, районные и областные, военные и арбитражные суды, апелляционные и кассационные инстанции.</p>
      </div><Link className="text-link" href="/courts/types">Посмотреть все {COURT_CATEGORIES.length} видов →</Link></div>
      <p>Выберите вид суда и регион в поиске вверху страницы или откройте справочник категорий. Сведения о конкретном суде отделены от общих правил подсудности.</p>
      <div className="court-filter-actions">
        <Link className="text-link" href="/courts/types">Список всех видов судов ↗</Link>
        <Link className="text-link" href="/jurisdiction">Подбор суда по адресу ↗</Link>
      </div>
    </section>
    <section className="section-wrap" aria-labelledby="first-pilot">
      <div className="section-intro">
        <span className="eyebrow">Официальные источники с указанием уровня достоверности</span>
        <h2 id="first-pilot">Первые {pilot.length} подробных справочных карточек</h2>
        <p>Карточки показывают только найденные опубликованные сведения и конкретные источники.
         Актуальность проверяйте на официальном сайте. Это не подтверждённые редакцией записи Neon.</p>
      </div>
      <div className="results">{pilot.map(item=><Link className="result-row" key={item.external_code}
        href={'/courts/region-'+item.region_code+'/sud-'+item.external_code.toLowerCase()}>
        <span><strong>{item.official_header_court_name}</strong>
          <small>{item.external_code} · {item.archived_values.address}</small>
          <small>Сведения из официальной публикации · дата исследования: 15.10.2026</small></span>
        <span aria-hidden="true">↗</span>
      </Link>)}</div>
    </section>
    <section className="section-wrap" aria-labelledby="official-directory">
      <div className="section-intro">
        <span className="eyebrow">Официальные источники</span>
        <h2 id="official-directory">Все уровни судебной системы</h2>
        <p>До завершения проверки данных вы можете перейти непосредственно к государственным судебным справочникам. Названия и контакты в них также следует проверять на актуальность.</p>
      </div>
      <div className="feature-grid">
        <article className="feature-card">
          <span className="feature-index">01 / ФЕДЕРАЛЬНЫЕ СУДЫ</span>
          <h3>Суды общей юрисдикции</h3>
          <p>Районные, городские, региональные, военные и другие федеральные суды. Поиск по субъекту, названию и классификационному коду.</p>
          <a className="text-link" href="https://sudrf.ru/index.php?act=go_search&id=300&searchtype=fs" target="_blank" rel="noopener noreferrer">Официальный реестр ГАС «Правосудие» ↗</a>
        </article>
        <article className="feature-card">
          <span className="feature-index">02 / АРБИТРАЖНЫЕ СУДЫ</span>
          <h3>Арбитражная система</h3>
          <p>Арбитражные суды субъектов, апелляционные и окружные суды, Суд по интеллектуальным правам. Территориальные округа учитываются отдельно.</p>
          <Link className="text-link" href="/courts/arbitration">Посмотреть 89 наименований судов и присутствий →</Link>
          <a className="text-link" href="https://arbitr.ru/?id_doc=20563&id_sec=353" target="_blank" rel="noopener noreferrer">Официальный первоисточник ↗</a>
        </article>
        <article className="feature-card">
          <span className="feature-index">03 / МИРОВЫЕ СУДЬИ</span>
          <h3>Судебные участки</h3>
          <p>Информация о судебных участках и органах обеспечения деятельности мировых судей по регионам. Границы подсудности требуют отдельной проверки.</p>
          <Link className="text-link" href="/courts/magistrates">Пилотный список 75 участков Хабаровского края →</Link>
          <a className="text-link" href="https://sudrf.ru/index.php?act=go_ms_search&id=300&searchtype=ms" target="_blank" rel="noopener noreferrer">Официальный реестр судебных участков ↗</a>
        </article>
      </div>
    </section>
    <section className="callout">
      <div><span className="eyebrow">Контроль качества</span><h2>От источника до публичной карточки</h2><p>Сначала сохраняем исходную запись и её код, проверяем контактные сведения и источник, затем допускаем карточку в общую выдачу. Непроверенные сведения не влияют на результаты поиска.</p></div>
      <Link className="button button-outline" href="/sources">Подробнее о проверке →</Link>
    </section>
    <section className="callout"><div><span className="eyebrow">Как мы работаем</span><h2>Источники каждой записи проверяются</h2><p>Отдельно фиксируем изменения адресов, статуса суда и назначения судей.</p></div><Link className="button button-outline" href="/sources">О методологии →</Link></section>
  </>;
}
