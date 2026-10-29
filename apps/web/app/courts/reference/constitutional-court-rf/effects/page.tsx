import Link from 'next/link';
import type {Metadata} from 'next';
const base='/courts/reference/constitutional-court-rf';
export const metadata:Metadata={
 title:'Последствия решений Конституционного Суда РФ — исполнение и пересмотр дел',
 description:'Правовая сила постановлений КС РФ, пересмотр дел заявителей и иных лиц, исполнение решений и практический порядок проверки.',
 robots:{index:false,follow:true}
};
const steps=[
 {title:'1. Прочитать именно резолютивную часть постановления',text:'Определите, признана ли норма неконституционной либо Конституционный Суд выявил обязательный конституционно-правовой смысл. Для последствий необходимо учитывать выводы суда, дату вступления постановления в силу и специальные указания об исполнении.'},
 {title:'2. Проверить силу решения и действие нормы',text:'По статье 79 ФКЗ № 1-ФКЗ решения КС РФ окончательны, действуют непосредственно и не требуют подтверждения другими органами. Вступление в силу постановления зависит от процедуры рассмотрения: после провозглашения на слушании либо после опубликования при рассмотрении без слушания.'},
 {title:'3. Различать положение заявителя и других лиц',text:'Для заявителя конституционного производства предусмотрены специальные последствия пересмотра. Для других лиц возможность пересмотра зависит от перечисленных в статье 79 и иных процессуальных законах условий, характера нарушения, состояния исполнения судебного акта и указаний Конституционного Суда.'},
 {title:'4. Выбрать компетентный суд и процессуальную процедуру',text:'Пересмотр гражданского, административного, арбитражного или уголовного дела не совершается автоматически на нашем сайте. Основание, срок, содержание и суд определяются соответствующим процессуальным кодексом и постановлением Конституционного Суда.'},
 {title:'5. Отслеживать изменение закона и исполнение постановления',text:'Исполнение решений может предполагать изменение законодательства или правоприменительной практики. Проверяйте официальные материалы КС РФ об обеспечении конституционной законности и актуальное состояние нормы.'}
] as const;
export default function ConstitutionalEffects(){
 return <article className="constitutional-reference-page">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span><Link href={base}>КС РФ</Link><span>/</span>Последствия решений</nav>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Юридическая сила · восстановление прав</span>
   <h1>Что делать после постановления Конституционного Суда РФ</h1>
   <p className="lead">Схема помогает отличить юридическую силу решения КС РФ от отдельной процедуры пересмотра первоначального судебного дела.</p>
   <p className="constitutional-small">Справочная информация. Не каждое постановление влечёт автоматическую отмену всех ранее принятых решений; для каждого дела требуется отдельная оценка.</p>
  </section>
  {steps.map(step=><section className="constitutional-block" key={step.title}>
    <div className="section-intro"><span className="eyebrow">Порядок действий</span><h2>{step.title}</h2></div>
    <p className="constitutional-library-paragraph">{step.text}</p>
   </section>)}
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Правовые основания</span><h2>Проверка последствий по первоисточникам</h2></div>
   <div className="constitutional-source-grid">
    <a href="https://www.ksrf.ru/about/legalbases/FCLM/Article79.php" target="_blank" rel="noopener noreferrer">Статья 79 ФКЗ — юридическая сила решений ↗</a>
    <a href="https://www.ksrf.ru/about/legalbases/FCLM/Article87.php" target="_blank" rel="noopener noreferrer">Статья 87 ФКЗ — итоговое решение ↗</a>
    <a href="https://www.ksrf.ru/about/legalbases/FCLM/Article100.php" target="_blank" rel="noopener noreferrer">Статья 100 ФКЗ — решение по жалобе ↗</a>
    <a href="https://www.ksrf.ru/about/Maintenance/" target="_blank" rel="noopener noreferrer">Исполнение решений КС РФ ↗</a>
    <Link href={base+'/practice'}>Каталог решений →</Link>
    <Link href={base+'/positions'}>Правовые позиции по темам →</Link>
   </div>
  </section>
 </article>;
}