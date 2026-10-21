import Link from 'next/link';
import type { Metadata } from 'next';
import {CourtDirectoryExplorer} from '../_components/court-directory-explorer';
import {directoryEntries,directoryCounts} from '../lib/court-directory';
import { getRegions } from '../lib/api';
import { researchRegions } from '../lib/research-courts';
import {pilotPublicCourts} from '../lib/pilot-public';

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
  const all=directoryEntries();
  const stats=directoryCounts();
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Суды России</div>
    <section className="section-hero">
      <span className="kicker">Судебная система РФ</span>
      <h1>Каталог судов России</h1>
      <p className="lead">Поиск по всем доступным записям: название, официальный код, вид суда и регион. Уровень проверки каждого результата указан отдельно.</p>
      <p><a className="text-link" href="#catalog-search">Перейти к поиску и фильтрам ↓</a></p>
    </section>
    <section className="section-wrap" aria-label="Общий поиск по судебным карточкам">
      <CourtDirectoryExplorer entries={all}/>
      <p className="court-source">Всего {stats.total} доступных записей: {stats.research} исследовательских, {stats.reference} справочных карточек с отдельными официальными ссылками и {stats.names} названий арбитражных судов. Это НЕ общий объём действующих судов РФ.</p>
    </section>
    <section className="section-wrap taxonomy-section">
      <div className="section-intro with-action"><div>
        <span className="eyebrow">Навигация по судебной системе</span><h2>Виды судов России</h2>
        <p>Мировые судьи, районные и областные суды, военные суды, арбитражные, апелляционные и кассационные инстанции.</p>
      </div><Link className="text-link" href="/courts/types">Все 15 категорий →</Link></div>
      <p><Link className="text-link" href="/courts/types">Как выбрать вид суда →</Link>
      {' · '}<Link className="text-link" href="/jurisdiction">Проверка подсудности по адресу →</Link></p>
    </section>
    <section className="section-wrap">
      <div className="section-intro"><span className="eyebrow">По регионам</span><h2>Опубликованные карточки судов</h2></div>
      {failed ? <div role="alert" className="notice">Не удалось получить список регионов. Попробуйте позже.</div>
        : regions.length ? <div className="region-grid">{regions.map(region =>
          <Link key={region.slug} className="region-item" href={'/courts/' + region.slug}>
            <span>{region.name}</span><small>{region.court_count} проверенных карточек</small><span aria-hidden="true">↗</span>
          </Link>)}</div>
        : <div className="empty-state"><h3>Реестр пока наполняется</h3>
          <p>Публичных карточек ещё нет. Подготовлена загрузка из официальных источников по всей России; до редакционной проверки суды не отображаются в каталоге.</p>
          <Link className="text-link" href="/courts/moscow">Посмотреть пилотный регион →</Link>
        </div>}
    </section>
    <section className="section-wrap" aria-labelledby="moscow-new-pilot">
      <div className="section-intro">
        <span className="eyebrow">Новая московская серия · источник: портал судов Москвы</span>
        <h2 id="moscow-new-pilot">12 подробных исследовательских досье судов Москвы</h2>
        <p>Контакты, виды дел, реальные номера из официальной выдачи, территориальная подсудность и практические инструкции. До проверки актуальности московские досье не считаются верифицированными.</p>
      </div>
      <Link className="text-link" href="/courts/moscow">Посмотреть московские карточки →</Link>
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
    <section className="section-wrap" aria-labelledby="research-regions">
      <div className="section-intro"><span className="eyebrow">Открытые источники · исследовательские карточки</span>
        <h2 id="research-regions">Предварительные списки по регионам</h2>
        <p><Link className="text-link" href="/courts/coverage">Посмотреть реальную наполненность карточек по регионам →</Link></p>
        <p>Подготовлены персональные страницы на основе открытых официальных перечней ГАС «Правосудие». Эти записи ещё не прошли независимую актуальную проверку, не считаются опубликованными верифицированными судами и не индексируются поисковыми системами.</p>
      </div>
      <div className="region-grid">{research.map(region=><Link className="region-item" key={region.slug}
        href={'/courts/'+region.slug}>
        <span>{region.name}</span><small>{region.count} предварительных карточек</small><span aria-hidden="true">↗</span>
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
