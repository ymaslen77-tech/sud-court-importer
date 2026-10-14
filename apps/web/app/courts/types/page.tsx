import Link from 'next/link';
import type {Metadata} from 'next';
import {CourtSearch} from '../../_components/court-search';
import {COURT_FAMILIES,COURT_CATEGORIES} from '../../lib/court-taxonomy';

export const metadata:Metadata={
 title:'Виды судов Российской Федерации — выбор из списка',
 description:'Выбор судебной инстанции в выпадающем списке, фильтрация по региону и официальным судебным сведениям.',
 robots:{index:false,follow:true}
};
export default function TypesPage(){
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды</Link><span>/</span>Виды судов</div>
  <section className="section-hero">
   <span className="kicker">Судебная система Российской Федерации</span>
   <h1>Выберите вид суда</h1>
   <p className="lead">Виды судов и регионы выбираются из выпадающих списков. Результаты разделены на подтверждённые и предварительные записи.</p>
   <CourtSearch compact/>
  </section>
  <section className="section-wrap">
   <div className="section-intro">
     <span className="eyebrow">Пояснения к судебной системе</span>
     <h2>Чем различаются категории</h2>
     <p>Правильный суд зависит от вида дела, территориальной подсудности и судебной инстанции. Ниже — справочные разделы о категориях, а не результаты определения суда по адресу.</p>
   </div>
   <div className="court-jurisdiction-guidance">
    {COURT_FAMILIES.map(f=><article key={f.id}>
     <h3>{f.title}</h3><p>{f.description}</p>
     <p className="court-source">{COURT_CATEGORIES.filter(c=>c.family===f.id).map(c=>
       <span key={c.slug}><Link href={'/courts/types/'+c.slug}>{c.short} ↗</Link>{' · '}</span>)}</p>
    </article>)}
   </div>
  </section>
  <section className="callout">
   <div><span className="eyebrow">Территориальная подсудность</span>
     <h2>Подобрать по адресу заявителя или ответчика</h2>
     <p>Адрес учитывается вместе с видом спора. Сервис подбирает возможные судебные органы для проверки, не выдавая предварительное совпадение за процессуальное решение.</p>
   </div><Link className="button button-outline" href="/jurisdiction">Подсудность по адресу →</Link>
  </section>
 </>;
}
