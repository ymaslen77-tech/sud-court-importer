import Link from 'next/link';
import type { Metadata } from 'next';
import { CourtSearch } from '../_components/court-search';
import { getRegions } from '../lib/api';

export const metadata: Metadata = {
  title: 'Каталог судов Российской Федерации',
  description: 'Поиск судов Российской Федерации, проверенных адресов и контактных данных.',
};
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
    <section className="section-wrap">
      <div className="section-intro"><span className="eyebrow">По регионам</span><h2>Опубликованные карточки судов</h2></div>
      {failed ? <div role="alert" className="notice">Не удалось получить список регионов. Попробуйте позже.</div>
        : regions.length ? <div className="region-grid">{regions.map(region =>
          <Link key={region.slug} className="region-item" href={'/courts/' + region.slug}>
            <span>{region.name}</span><small>{region.court_count} проверенных карточек</small><span aria-hidden="true">↗</span>
          </Link>)}</div>
        : <div className="empty-state"><h3>Реестр пока наполняется</h3>
          <p>Публичных карточек ещё нет. Первый регион для загрузки — Москва. После проверки источников суды появятся здесь автоматически.</p>
          <Link className="text-link" href="/courts/moscow">Посмотреть пилотный регион →</Link>
        </div>}
    </section>
    <section className="callout"><div><span className="eyebrow">Как мы работаем</span><h2>Источники каждой записи проверяются</h2><p>Отдельно фиксируем изменения адресов, статуса суда и назначения судей.</p></div><Link className="button button-outline" href="/sources">О методологии →</Link></section>
  </>;
}
