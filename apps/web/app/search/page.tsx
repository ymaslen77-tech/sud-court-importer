import Link from 'next/link';
import type { Metadata } from 'next';
import { CourtSearch } from '../_components/court-search';
import { searchCourts } from '../lib/api';
import { researchSearch } from '../lib/research-courts';

export const metadata: Metadata = { title: 'Поиск судов России', robots: { index: false, follow: true } };
type Props = { searchParams: Promise<{ q?: string | string[] }> };
export default async function SearchPage({searchParams}:Props) {
  const params = await searchParams;
  const q = (typeof params.q === 'string' ? params.q : '').trim();
  let courts: Awaited<ReturnType<typeof searchCourts>> = [];
  let failed = false;
  const valid = q.length >= 2 && q.length <= 100;
  const research = valid ? researchSearch(q) : [];
  if (valid) {
    try { courts = await searchCourts(q); } catch { failed = true; }
  }
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Поиск</div>
    <section className="section-hero">
      <span className="kicker">Поиск по реестру</span>
      <h1>Найти суд</h1>
      <p className="lead">Ищите по названию суда, адресу или официальному классификационному коду. В результатах только проверенные карточки.</p>
      <CourtSearch initialValue={q}/>
    </section>
    <section className="section-wrap">
      <div className="section-intro"><span className="eyebrow">Результаты</span>
      <h2>{q ? 'По запросу «' + q + '»' : 'Начните поиск'}</h2></div>
      {!q ? <div className="empty-state">Укажите название, адрес или классификационный код суда.</div>
        : !valid ? <div className="notice">Используйте запрос от 2 до 100 символов.</div>
        : failed ? <div className="notice" role="alert">Поиск временно недоступен. Повторите попытку позднее.</div>
        : courts.length ? <div className="results">
          {courts.map(court => <Link className="result-row" key={court.id} href={'/courts/' + court.region_slug + '/' + court.slug}>
            <span><strong>{court.name}</strong><small>{court.region_name}{court.address ? ' · ' + court.address : ''}</small></span><span aria-hidden="true">↗</span>
          </Link>)}
        </div> : <div className="empty-state"><h3>Проверенных совпадений пока нет</h3><p>Это не означает, что такого суда не существует. Каталог ещё наполняется.</p><Link className="text-link" href="/courts">Все опубликованные регионы →</Link></div>}
    </section>
    {research.length>0?<section className="section-wrap" aria-labelledby="research-search-results">
      <div className="section-intro">
        <span className="eyebrow">Предварительные записи из официальных источников</span>
        <h2 id="research-search-results">Ещё {research.length} исследовательских совпадений</h2>
        <p>Эти судебные карточки не прошли повторную проверку актуальности. Они отделены от подтверждённых результатов и закрыты от поисковой индексации.</p>
      </div>
      <div className="results">{research.map(court=>
        <Link className="result-row" key={court.code}
          href={'/courts/'+court.region+'/sud-'+court.code.toLowerCase()}>
          <span><strong>{court.name}</strong>
            <small>{court.code} · {court.regionName} · {court.address}</small>
            <small>Требует редакционной проверки</small></span>
          <span aria-hidden="true">↗</span>
        </Link>)}</div>
    </section>:null}
  </>;
}
