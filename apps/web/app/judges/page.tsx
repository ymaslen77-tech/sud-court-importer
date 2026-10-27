import Link from 'next/link';
import type {Metadata} from 'next';
import {COURT_CATEGORIES,COURT_FAMILIES} from '../lib/court-taxonomy';
import {judgeProfileHref,pushkinskyJudges} from '../lib/judge-dossiers';

export const metadata:Metadata={
 title:'Судьи России — мировые, районные, областные, военные и арбитражные',
 description:'Категории судей РФ по судам: мировые судьи, судьи районных, областных, военных, арбитражных, апелляционных и кассационных судов.',
 robots:{index:false,follow:true}
};
type Props={searchParams:Promise<{q?:string|string[]}>};
export default async function JudgesPage({searchParams}:Props){
 const query=await searchParams;
 const q=typeof query.q==='string'?query.q.trim().slice(0,80):'';
 const normalized=q.toLocaleLowerCase('ru').replace(/ё/g,'е');
 const matches=pushkinskyJudges.filter(judge=>!normalized||judge.name.toLocaleLowerCase('ru').replace(/ё/g,'е').includes(normalized));
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Судьи</div>
  <section className="section-hero">
   <span className="kicker">Состав судебных органов</span>
   <h1>Судьи Российской Федерации</h1>
   <p className="lead">Мировые судьи, судьи районных и городских судов, областных и краевых, военных, арбитражных, апелляционных и кассационных судов.</p>
   <div className="notice"><span className="notice-dot" aria-hidden="true"/>Начато наполнение проверяемыми персональными карточками. Первые записи получены из опубликованного состава Пушкинского городского суда; это не полный реестр всех действующих судей России.</div>
  </section>
  <section className="section-wrap" aria-labelledby="judge-first-list">
   <div className="section-intro">
    <span className="eyebrow">Первый региональный справочник · Московская область</span>
    <h2 id="judge-first-list">Персональные карточки из официальной публикации: {pushkinskyJudges.length}</h2>
    <p>Первый набор относится к Пушкинскому городскому суду. Данные о должностях из опубликованного справочника;
     персональные назначения, биографии и конкретные дела проверяются индивидуально. В официальном историческом
     очерке суда перечислен более широкий состав — пока нельзя считать этот список исчерпывающим.</p>
   </div>
   <form action="/judges" method="get" role="search" className="court-advanced-search">
    <label htmlFor="judge-q">Найти судью по ФИО</label>
    <input id="judge-q" type="search" name="q" defaultValue={q} placeholder="Например: Базылева Татьяна Анатольевна" maxLength={80}/>
    <div className="court-filter-actions"><button className="button button-red" type="submit">Найти судью →</button></div>
   </form>
   {matches.length?
     <div className="results">{matches.map(judge=><Link className="result-row"
       key={judge.slug} href={judgeProfileHref(judge)}>
       <span><strong>{judge.name}</strong>
        <small>{judge.publishedRole} · {judge.courtName}</small>
        <small>{judge.historicalAppointments.length?'История назначений и проверенные примеры дел':'Предварительная кадровая справка с первоисточником'}</small>
       </span><span aria-hidden="true">↗</span>
     </Link>)}</div>
     :<div className="empty-state">В опубликованном предварительном наборе судей совпадений нет. Это не означает, что такого судьи не существует.</div>}
  </section>
  <section className="section-wrap">
    <div className="section-intro"><span className="eyebrow">Каталог по категориям судов</span><h2>Выберите, в каком суде работает судья</h2><p>Поиск конкретных ФИО и дат назначений будет подключён только после проверки официальных кадровых сведений.</p></div>
    {COURT_FAMILIES.map(family=><div className="judge-family" key={family.id}>
       <h3>{family.title}</h3><div className="judge-links">{COURT_CATEGORIES.filter(c=>c.family===family.id).map(c=><Link href={'/courts/types/'+c.slug} key={c.slug}>
       <span>{c.short}</span><span aria-hidden="true">↗</span></Link>)}</div>
    </div>)}
  </section>
  <section className="section-wrap">
   <div className="section-intro"><span className="eyebrow">Точность данных</span><h2>Как устроена карточка судьи</h2></div>
   <div className="feature-grid two-columns">
    <article className="feature-card"><h3>ФИО и должность</h3><p>Публикуем только при надёжной идентификации, проверяем однофамильцев.</p></article>
    <article className="feature-card"><h3>Суд и период назначения</h3><p>Связь с конкретным судом, дата начала и прекращения полномочий — с подтверждённым источником.</p></article>
    <article className="feature-card"><h3>Судебная практика</h3><p>Судебные акты связываются с судьёй только при однозначном подтверждении.</p></article>
    <article className="feature-card"><h3>История изменений</h3><p>Сохраняем источники, историю перевода и обновления должностей.</p></article>
   </div>
  </section>
  <div className="callout"><div><h2>Найти суд по названию</h2><p>Каталог судов и судебных участков связан с выбранной категорией.</p></div><Link className="button button-outline" href="/courts">Перейти к судам →</Link></div>
 </>;
}
