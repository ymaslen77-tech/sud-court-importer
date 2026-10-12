import Link from 'next/link';
import type { Metadata } from 'next';
import { CourtSearch } from '../_components/court-search';
import { searchCourts } from '../lib/api';

export const metadata: Metadata = { title: 'Поиск судов России', robots: { index: false, follow: true } };
type Props = { searchParams: Promise<{ q?: string | string[] }> };
export default async function SearchPage({searchParams}:Props) {
  const params = await searchParams;
  const q = (typeof params.q === 'string' ? params.q : '').trim();
  let courts: Awaited<ReturnType<typeof searchCourts>> = [];
  let failed = false;
  const valid = q.length >= 2 && q.length <= 100;
  if (valid) {
    try { courts = await searchCourts(q); } catch { failed = true; }
  }
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Поиск</div>
    <section className="section-hero">
      <span className="kicker">Поиск по реестру</span>
      <h1>Найти суд</h1>
      <p className="lead">Введите часть официального названия. Поиск работает только по подтверждённым карточкам.</p>
      <CourtSearch initialValue={q}/>
    </section>
    <section className="section-wrap">
      <div className="section-intro"><span className="eyebrow">Результаты</span>
      <h2>{q ? 'По запросу «' + q + '»' : 'Начните поиск'}</h2></div>
      {!q ? <div className="empty-state">Укажите название суда в строке поиска.</div>
        : !valid ? <div className="notice">Используйте запрос от 2 до 100 символов.</div>
        : failed ? <div className="notice" role="alert">Поиск временно недоступен. Повторите попытку позднее.</div>
        : courts.length ? <div className="results">
          {courts.map(court => <Link className="result-row" key={court.id} href={'/courts/' + court.region_slug + '/' + court.slug}>
            <span><strong>{court.name}</strong><small>{court.region_name}{court.address ? ' · ' + court.address : ''}</small></span><span aria-hidden="true">↗</span>
          </Link>)}
        </div> : <div className="empty-state"><h3>Проверенных совпадений пока нет</h3><p>Это не означает, что такого суда не существует. Каталог ещё наполняется.</p><Link className="text-link" href="/courts">Все опубликованные регионы →</Link></div>}
    </section>
  </>;
}
