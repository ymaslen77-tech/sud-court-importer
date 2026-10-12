import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getCourt,safeOfficialUrl} from '../../../lib/api';

type Props={params:Promise<{region:string;court:string}>};
export const dynamic='force-dynamic';
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const p=await params;
  try {
    const c=await getCourt(p.region,p.court);
    return c
      ? {title:c.name,description:c.name+': адрес, контакты и проверенные сведения о суде.',robots:{index:!!c.address,follow:true}}
      : {title:'Суд не найден',robots:{index:false,follow:true}};
  } catch {return {title:'Сведения о суде',robots:{index:false,follow:true}};}
}
export default async function CourtPage({params}:Props){
  const p=await params;
  const court=await getCourt(p.region,p.court);
  if(!court)notFound();
  const website=safeOfficialUrl(court.official_url);
  const source=safeOfficialUrl(court.source_url);
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды</Link><span>/</span><Link href={'/courts/'+p.region}>Регион</Link><span>/</span>{court.name}</div>
    <section className="section-hero">
      <span className="kicker">Подтверждённая карточка суда</span>
      <h1>{court.name}</h1>
      <p className="lead">{court.court_type}. Справочная информация о судебном органе.</p>
      <div className="notice"><span className="notice-dot" aria-hidden="true"/>Дата проверки: {new Date(court.verified_at).toLocaleDateString('ru-RU',{timeZone:'UTC'})}</div>
    </section>
    <div className="court-detail-grid">
      <section className="detail-card"><span className="eyebrow">Контактные сведения</span><h2>Как связаться с судом</h2>
        <dl className="court-facts">
          <div><dt>Адрес</dt><dd>{court.address ?? 'Официальный адрес ещё не подтверждён'}</dd></div>
          <div><dt>Телефон</dt><dd>{court.phone ?? 'Нет подтверждённых данных'}</dd></div>
          <div><dt>Электронная почта</dt><dd>{court.email ?? 'Нет подтверждённых данных'}</dd></div>
        </dl>
        {website ? <a className="button button-dark" target="_blank" rel="noopener noreferrer" href={website}>Официальный сайт суда ↗</a>:null}
        {source ? <p className="court-source"><a href={source} target="_blank" rel="noopener noreferrer">Источник опубликованных сведений ↗</a></p> : <p className="court-source">Ссылка на набор данных пока не подтверждена.</p>}
      </section>
      <aside className="detail-card detail-side"><span className="eyebrow">Дополнительная информация</span><h2>Проверить перед обращением</h2><p>График приёма, территориальную подсудность, действующий состав судей и порядок подачи документов следует уточнять по официальным публикациям.</p><Link className="text-link" href="/jurisdiction">О правилах подсудности →</Link><Link className="text-link" href="/sources">Об источниках →</Link></aside>
    </div>
    <section className="callout"><div><span className="eyebrow">Работа с данными</span><h2>Здесь появятся судьи, подсудность и судебные акты</h2><p>Эти сведения будут связаны с карточкой только после проверки источников.</p></div><Link className="button button-outline" href="/practice">Судебная практика →</Link></section>
  </>;
}
