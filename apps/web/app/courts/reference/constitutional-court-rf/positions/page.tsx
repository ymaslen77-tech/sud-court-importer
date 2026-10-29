import Link from 'next/link';
import type {Metadata} from 'next';
import {CONSTITUTIONAL_THEMES,CONSTITUTIONAL_CASES} from '../../../../lib/constitutional-practice';
const base='/courts/reference/constitutional-court-rf';
export const metadata:Metadata={
 title:'Правовые позиции Конституционного Суда РФ по темам',
 description:'Тематическая навигация по редакционно разобранным постановлениям с первоисточниками.',
 robots:{index:false,follow:true}
};
export default function ConstitutionalPositionsPage(){
 return <article className="constitutional-reference-page">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span><Link href={base}>КС РФ</Link><span>/</span>Правовые позиции</nav>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Систематизация практики</span><h1>Правовые позиции Конституционного Суда по темам</h1>
   <p className="lead">Раздел объединяет краткие редакционные описания постановлений по правовым вопросам и ведёт к карточкам с нормативными основаниями и официальными источниками.</p>
   <p className="constitutional-small">Выборка не является исчерпывающей и не воспроизводит официальный классификатор КС РФ. Перед применением правовой позиции изучите полный акт.</p>
  </section>
  <div className="ksrf-position-groups">
   {CONSTITUTIONAL_THEMES.map(theme=>{
    const cases=CONSTITUTIONAL_CASES.filter(c=>c.theme===theme);
    return <section key={theme} className="constitutional-block">
     <div className="section-intro"><span className="eyebrow">{cases.length} {cases.length===1?'решение':'решения'}</span><h2>{theme}</h2></div>
     <ul className="ksrf-related-decisions">
      {cases.map(c=><li key={c.slug}><Link href={base+'/practice/'+c.slug}><strong>№ {c.number}/{c.year}</strong> — {c.title}</Link><p>{c.position}</p></li>)}
     </ul>
    </section>;
   })}
  </div>
  <div className="constitutional-source-grid">
   <Link href={base+'/practice'}>Весь тематический каталог решений →</Link>
   <Link href={base+'/documents/complaint'}>Подготовить проект обращения →</Link>
   <Link href={base}>Вернуться к карточке КС РФ →</Link>
   <a href="https://www.ksrf.ru/Decision/lp/" target="_blank" rel="noopener noreferrer">Официальные правовые позиции ↗</a>
  </div>
 </article>;
}