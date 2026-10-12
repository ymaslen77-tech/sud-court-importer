import Link from 'next/link';
import type {Metadata} from 'next';
import {COURT_CATEGORIES,COURT_FAMILIES} from '../lib/court-taxonomy';

export const metadata:Metadata={
 title:'Судьи России — мировые, районные, областные, военные и арбитражные',
 description:'Категории судей РФ по судам: мировые судьи, судьи районных, областных, военных, арбитражных, апелляционных и кассационных судов.',
 robots:{index:false,follow:true}
};
export default function JudgesPage(){
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Судьи</div>
  <section className="section-hero">
   <span className="kicker">Состав судебных органов</span>
   <h1>Судьи Российской Федерации</h1>
   <p className="lead">Мировые судьи, судьи районных и городских судов, областных и краевых, военных, арбитражных, апелляционных и кассационных судов.</p>
   <div className="notice"><span className="notice-dot" aria-hidden="true"/>Реестр персональных назначений пока наполняется. Категории не подтверждают работу конкретного судьи в выбранном суде.</div>
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
