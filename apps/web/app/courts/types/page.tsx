import Link from 'next/link';
import type {Metadata} from 'next';
import {COURT_CATEGORIES,COURT_FAMILIES} from '../../lib/court-taxonomy';

export const metadata:Metadata = {
 title:'Виды судов Российской Федерации — структура и инстанции',
 description:'Верховный Суд, мировые судьи, районные, областные, военные и арбитражные суды: официальный классификатор для навигации.',
 robots:{index:true,follow:true}
};
export default function TypesPage(){
 return <>
 <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды</Link><span>/</span>Виды судов</div>
 <section className="section-hero">
  <span className="kicker">Судебная система Российской Федерации</span>
  <h1>Виды судов и судебные инстанции</h1>
  <p className="lead">Выберите категорию суда. Судебная инстанция, специализация и статус конкретного судьи — не одно и то же. Для обращения в суд необходимо учитывать подсудность конкретного дела.</p>
 </section>
 {COURT_FAMILIES.map(family=><section className="section-wrap taxonomy-section" key={family.id}>
   <div className="section-intro"><span className="eyebrow">Судебная система</span><h2>{family.title}</h2><p>{family.description}</p></div>
   <div className="taxonomy-grid">{COURT_CATEGORIES.filter(c=>c.family===family.id).map(c=><Link
     key={c.slug} className="taxonomy-card" href={'/courts/types/'+c.slug}>
     <span className="taxonomy-overline">{c.level}</span><h3>{c.title}</h3>
     <p>{c.description}</p><span className="taxonomy-cta">Подробнее о категории <span aria-hidden="true">↗</span></span>
   </Link>)}</div>
 </section>)}
 <div className="callout"><div><span className="eyebrow">Важное различие</span><h2>Судья — человек, суд — орган</h2>
 <p>Судебные участки мировых судей, постоянные судебные присутствия и судебные коллегии нельзя без проверки считать самостоятельными судами. Сведения о назначениях будут привязаны к конкретным судьям.</p></div><Link href="/judges" className="button button-outline">К видам судей →</Link></div>
 </>;
}
