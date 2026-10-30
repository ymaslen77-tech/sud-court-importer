import Link from 'next/link';
import type {Metadata} from 'next';
import {ConstitutionalComplaintSelfCheck} from '../../../../../_components/constitutional-complaint-selfcheck';
const base='/courts/reference/constitutional-court-rf';
export const metadata:Metadata={
 title:'Самопроверка жалобы КС РФ — шаг 2: условия допустимости',
 description:'Применение нормы судом, нарушение конституционных прав, кассация, годичный срок. Персональная справочная самопроверка с юридическими пояснениями.',
 robots:{index:false,follow:true}
};
export default function ConstitutionalComplaintEligibility(){
 return <article className="constitutional-reference-page ksrf-guide">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href={base}>КС РФ</Link><span>/</span><Link href={base+'/check'}>Самопроверка</Link><span>/</span>Условия допустимости</nav>
  <div className="ksrf-guide-stepper" aria-label="Порядок самопроверки">
   <Link href={base+'/check'}>1. Предмет</Link><strong aria-current="step">2. Допустимость</strong><span>3. Документы и подача</span>
  </div>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Шаг 2 из 3 · Индивидуальная жалоба</span>
   <h1>Есть ли основания для обращения в КС РФ?</h1>
   <p className="lead">Проверьте применение нормативного акта в своём деле, конституционные права, судебные инстанции и срок обращения. По итогам вы получите отдельное объяснение по каждому ответу.</p>
   <p className="constitutional-small">Оценка предварительная: она не подтверждает допустимость обращения и не заменяет решение КС РФ. Введённые ответы остаются только в памяти этой вкладки; при уходе со страницы они не сохраняются.</p>
  </section>
  <section className="constitutional-block ksrf-guide-check">
   <ConstitutionalComplaintSelfCheck/>
  </section>
  <section className="constitutional-block">
   <div className="ksrf-guide-action">
    <Link className="button button-red" href={base+'/check/documents'}>Шаг 3. Структура жалобы и приложения →</Link>
    <Link className="button button-outline" href={base+'/check'}>← Вернуться к предмету обращения</Link>
   </div>
   <details className="ksrf-guide-source"><summary>Официальные источники и исключения по статье 97</summary>
    <p>Судебное применение нормы, годичный срок и исчерпание средств судебной защиты определяются статьями 96–97 ФКЗ № 1-ФКЗ. Исключение, связанное с устойчивой судебной практикой, оценивает только сам Конституционный Суд.</p>
    <ul>
     <li><a href="https://www.ksrf.ru/about/legalbases/FCLM/Article97.php" target="_blank" rel="noopener noreferrer">Статья 97 — допустимость жалобы ↗</a></li>
     <li><a href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Официальный алгоритм самопроверки ↗</a></li>
     <li><a href="https://www.ksrf.ru/Petition/CommonComplaintQ.php" target="_blank" rel="noopener noreferrer">Разъяснения по жалобам на сайте КС РФ ↗</a></li>
    </ul>
   </details>
  </section>
 </article>;
}
