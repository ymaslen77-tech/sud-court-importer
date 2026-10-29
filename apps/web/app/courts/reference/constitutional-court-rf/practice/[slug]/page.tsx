import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {CONSTITUTIONAL_CASES,findConstitutionalCase} from '../../../../../lib/constitutional-practice';
type Props={params:Promise<{slug:string}>};
const base='/courts/reference/constitutional-court-rf';
export const dynamic='force-dynamic';
export function generateStaticParams(){return CONSTITUTIONAL_CASES.map(c=>({slug:c.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const c=findConstitutionalCase(slug);
 if(!c)return {title:'Решение не найдено',robots:{index:false,follow:false}};
 return {title:'Постановление '+c.number+'/'+c.year+' — '+c.title,
  description:c.issue,robots:{index:false,follow:true}};
}
export default async function ConstitutionalPracticeDetail({params}:Props){
 const {slug}=await params;const c=findConstitutionalCase(slug);if(!c)notFound();
 const same=CONSTITUTIONAL_CASES.filter(x=>x.slug!==slug&&x.theme===c.theme).slice(0,4);
 return <article className="constitutional-reference-page">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span><Link href={base}>КС РФ</Link><span>/</span><Link href={base+'/practice'}>Практика</Link><span>/</span>№ {c.number}/{c.year}</nav>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Постановление № {c.number}/{c.year} · {c.date}</span><h1>{c.title}</h1>
   <p className="lead">{c.issue}</p><p className="constitutional-small">Редакционное изложение для навигации по первоисточникам; не цитата из решения и не готовое правовое заключение. Сведения о нормативном регулировании и практике могут меняться.</p>
   <div className="court-filter-actions"><Link className="button button-outline" href={base+'/practice'}>← Все решения</Link><Link className="button button-outline" href={base+'/positions'}>Правовые позиции →</Link></div>
  </section>
  <section className="constitutional-block ksrf-case-facts">
   <div className="section-intro"><span className="eyebrow">Предмет судебного контроля</span><h2>Что проверял Конституционный Суд</h2></div>
   <dl className="court-facts"><div><dt>Номер</dt><dd>№ {c.number}/{c.year}</dd></div><div><dt>Дата</dt><dd>{c.date}</dd></div><div><dt>Категория</dt><dd>{c.theme}</dd></div><div><dt>Нормативное положение</dt><dd>{c.norm}</dd></div></dl>
   <h3>Конституционно-правовой вопрос</h3><p>{c.issue}</p>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Редакционный разбор</span><h2>Правовая позиция</h2></div>
   <p className="constitutional-library-paragraph">{c.position}</p>
   <h3>Результат и значение</h3><p className="constitutional-library-paragraph">{c.result}</p>
   <p className="constitutional-small">Нельзя автоматически переносить вывод по постановлению на другую ситуацию без анализа его резолютивной части, применённых норм, даты и последующего законодательства.</p>
  </section>
  <aside className="constitutional-primary-source" id="primary-source">
   <span className="eyebrow">Официальная публикация</span><h2>Проверить текст решения</h2>
   <p>Откройте первоисточник и сверьте точные формулировки, резолютивную часть и последствия для участников дела.</p>
   <a href={c.source} className="text-link" target="_blank" rel="noopener noreferrer">{c.sourceLabel} ↗</a>
   <p className="constitutional-small">Название, номер и предмет проверены 29.10.2026; индивидуальная юридическая экспертиза обстоятельств дела не проводилась.</p>
  </aside>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Связанные действия</span><h2>Судебная практика, маршруты и документы</h2></div>
   <div className="constitutional-source-grid">
    <Link href={base+'/practice'}>Другие решения Конституционного Суда →</Link>
    <Link href={base+'/positions'}>Подборки правовых позиций →</Link>
    <Link href={base+'/info/complaint'}>Требования к конституционной жалобе →</Link>
    <Link href={base+'/documents/complaint'}>Генератор проекта конституционной жалобы →</Link>
    <Link href="/search">Общий поиск по судебному каталогу →</Link>
   </div>
   {same.length?<><h3>Другие решения по этой теме</h3><ul className="ksrf-related-decisions">{same.map(item=><li key={item.slug}><Link href={base+'/practice/'+item.slug}>№ {item.number}/{item.year} — {item.title}</Link></li>)}</ul></>:null}
  </section>
 </article>;
}