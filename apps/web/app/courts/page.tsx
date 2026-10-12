import Link from 'next/link';
import type { Metadata } from 'next';
import { CourtSearch } from '../_components/court-search';
import { getRegions } from '../lib/api';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  try {
    const regions = await getRegions();
    return { title: 'Каталог судов Российской Федерации', description: 'Поиск судов Российской Федерации, проверенных адресов и контактных данных.', robots: { index: regions.length > 0, follow: true } };
  } catch {
    return { title: 'Каталог судов Российской Федерации', robots: { index: false, follow: true } };
  }
}
export default async function CourtsDirectory() {
  let regions: Awaited<ReturnType<typeof getRegions>> = [];
  let failed = false;
  try { regions = await getRegions(); } catch { failed = true; }
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Суды России</div>
    <section className="section-hero">
      <span className="kicker">Судебная система РФ</span>
      <h1>Каталог судов России</h1>
      <p className="lead">Найдите суд по названию или перейдите к региону. В справочнике отображаются только подтверждённые сведения.</p>
      <CourtSearch compact />
    </section>
    <section className="section-wrap taxonomy-section">
      <div className="section-intro with-action"><div>
        <span className="eyebrow">Навигация по судебной системе</span><h2>Виды судов России</h2>
        <p>Мировые судьи, районные и областные суды, военные суды, арбитражные, апелляционные и кассационные инстанции.</p>
      </div><Link className="text-link" href="/courts/types">Все 15 категорий →</Link></div>
      <div className="taxonomy-grid">
        <Link className="taxonomy-card" href="/courts/types/general-magistrate"><span className="taxonomy-overline">Суды субъектов РФ</span><h3>Мировые судьи</h3><p>Судебные участки и компетенция мировых судей.</p><span className="taxonomy-cta">Подробнее ↗</span></Link>
        <Link className="taxonomy-card" href="/courts/types/general-district"><span className="taxonomy-overline">Общая юрисдикция</span><h3>Районные и городские</h3><p>Суды районного уровня и предусмотренный законом пересмотр.</p><span className="taxonomy-cta">Подробнее ↗</span></Link>
        <Link className="taxonomy-card" href="/courts/types/general-regional"><span className="taxonomy-overline">Суды субъектов РФ</span><h3>Областные, краевые и республиканские</h3><p>Суды уровня субъекта Российской Федерации.</p><span className="taxonomy-cta">Подробнее ↗</span></Link>
        <Link className="taxonomy-card" href="/courts/types/military-garrison"><span className="taxonomy-overline">Военные суды</span><h3>Гарнизонные и окружные военные</h3><p>Отдельная система военной подсудности.</p><span className="taxonomy-cta">Подробнее ↗</span></Link>
        <Link className="taxonomy-card" href="/courts/types/arbitration-subject"><span className="taxonomy-overline">Экономические споры</span><h3>Арбитражные суды</h3><p>Суды субъектов, апелляция и кассация.</p><span className="taxonomy-cta">Подробнее ↗</span></Link>
        <Link className="taxonomy-card" href="/courts/types/general-cassation"><span className="taxonomy-overline">Инстанции</span><h3>Апелляционные и кассационные суды</h3><p>Пересмотр судебных актов по процессуальным правилам.</p><span className="taxonomy-cta">Подробнее ↗</span></Link>
      </div>
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
