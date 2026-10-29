import Link from 'next/link';
import type {Metadata} from 'next';
import {ConstitutionalPracticeCatalog} from '../../../../_components/constitutional-practice-catalog';
import {CONSTITUTIONAL_CASES} from '../../../../lib/constitutional-practice';
const base='/courts/reference/constitutional-court-rf';
export const metadata:Metadata={
 title:'Судебная практика Конституционного Суда РФ — поиск решений и правовых позиций',
 description:'Проверенная тематическая подборка решений Конституционного Суда с поиском по году, нормам законодательства, теме и номеру постановления.',
 robots:{index:false,follow:true}
};
export default function ConstitutionalPracticePage(){
 return <article className="constitutional-reference-page">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span><Link href={base}>Конституционный Суд РФ</Link><span>/</span>Судебная практика</nav>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Правовые позиции · проверенные решения</span>
   <h1>Судебная практика Конституционного Суда РФ</h1>
   <p className="lead">Тематический каталог из {CONSTITUTIONAL_CASES.length} редакционно описанных постановлений: предмет, конституционный вопрос, правовая позиция, результат и проверяемый первоисточник.</p>
   <p className="constitutional-small">Это выборка, а не полный архив. Дата проверки наименований и источников: 29 октября 2026 года. Исчерпывающий поиск и актуальные тексты — на официальном сайте суда.</p>
   <div className="court-filter-actions"><Link className="button button-outline" href={base}>← Карточка КС РФ</Link><Link className="button button-outline" href={base+'/positions'}>Правовые позиции по темам →</Link></div>
  </section>
  <ConstitutionalPracticeCatalog/>
 </article>;
}