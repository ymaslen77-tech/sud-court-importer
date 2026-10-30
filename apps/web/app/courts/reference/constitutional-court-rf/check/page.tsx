import Link from 'next/link';
import type {Metadata} from 'next';
const base='/courts/reference/constitutional-court-rf';
export const metadata:Metadata={
 title:'Самопроверка жалобы в КС РФ — шаг 1: предмет обращения',
 description:'Что можно обжаловать в Конституционном Суде РФ: законы, нормативные акты и ограничения полномочий. Первый шаг собственной справочной самопроверки.',
 robots:{index:false,follow:true}
};
const options=[
 {title:'Федеральный закон, кодекс или закон субъекта РФ',kind:'possible',info:'Такая норма может быть предметом индивидуальной жалобы при её применении судом в конкретном деле, нарушении конституционных прав и соблюдении условий статьи 97.'},
 {title:'Иной нормативный акт органа власти',kind:'check',info:'Нужно установить вид и автора акта. Статья 96 предусматривает отдельные нормативные акты Президента РФ, палат Федерального Собрания, Правительства РФ и органов субъектов РФ. Не все ведомственные, муниципальные или индивидуальные акты подпадают под эту процедуру.'},
 {title:'Судебное решение, оценка фактов или доказательств',kind:'not',info:'КС РФ не выступает дополнительной апелляцией: он проверяет конституционность применённой нормы, но не пересматривает фактические обстоятельства дела и достоверность доказательств.'},
 {title:'Решение, действие или бездействие должностного лица',kind:'not',info:'Обычно оспаривается в судах общей юрисдикции или арбитражных судах по процессуальным правилам. Само такое действие не является самостоятельным предметом индивидуальной конституционной жалобы.'},
 {title:'Толкование Конституции РФ или спор между органами власти',kind:'not',info:'Для этих полномочий предусмотрен специальный круг государственных заявителей. Частное лицо не может заменить их своим обращением.'},
 {title:'Международный договор или противоречие между статьями Конституции',kind:'check',info:'Проверка международных договоров относится к специальным полномочиям с особым кругом заявителей. Сравнение одних норм Конституции с другими само по себе не образует предмет индивидуальной жалобы.'}
] as const;
export default function ConstitutionalComplaintCheckStart(){
 return <article className="constitutional-reference-page ksrf-guide">
  <nav className="breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span>/</span><Link href={base}>Конституционный Суд РФ</Link><span>/</span>Самопроверка жалобы</nav>
  <div className="ksrf-guide-stepper" aria-label="Порядок самопроверки">
   <strong aria-current="step">1. Предмет</strong><span>2. Допустимость</span><span>3. Документы и подача</span>
  </div>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Шаг 1 из 3 · Справочный маршрут</span>
   <h1>Что именно вы хотите оспорить?</h1>
   <p className="lead">Перед жалобой важно отделить проверку конституционности нормативного акта от обжалования решения суда или действий чиновника.</p>
   <p className="constitutional-small">Раздел составлен по официальному алгоритму Секретариата КС РФ и статьям 3, 96–97 ФКЗ № 1-ФКЗ, но не является официальным алгоритмом. Ответы не собираются и не направляются на сервер.</p>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Выберите свою ситуацию</span><h2>Возможные предметы обращения</h2><p>Нажмите на подходящий пункт: разъяснение откроется здесь, без перехода на другой сайт.</p></div>
   <div className="ksrf-guide-options">
    {options.map((o,i)=><details key={o.title} className="ksrf-guide-option">
      <summary><span className="ksrf-guide-number">{String(i+1).padStart(2,'0')}</span>{o.title}<span className="ksrf-guide-chevron" aria-hidden="true">+</span></summary>
      <div className="ksrf-guide-option-body">
       <strong>{o.kind==='possible'?'Возможно при соблюдении остальных условий':o.kind==='check'?'Нужно проверить вид акта и полномочия КС РФ':'Сам по себе вопрос не относится к индивидуальной жалобе'}</strong>
       <p>{o.info}</p>
       <Link href={o.kind==='not'?'/courts':base+'/check/eligibility'}>{o.kind==='not'?'Найти иной способ судебной защиты →':'Проверить допустимость моей жалобы →'}</Link>
      </div>
    </details>)}
   </div>
   <div className="ksrf-guide-action">
    <Link className="button button-red" href={base+'/check/eligibility'}>Шаг 2. Проверить допустимость →</Link>
    <Link className="button button-outline" href={base}>← Карточка КС РФ</Link>
   </div>
   <details className="ksrf-guide-source"><summary>Официальная основа шага 1 и проверка актуальности</summary>
    <p>Наше изложение основано на официальном алгоритме Секретариата КС РФ и статьях 3, 96 ФКЗ. Первоисточники доступны без ограничений:</p>
    <ul><li><a href="https://www.ksrf.ru/Petition/algo/mainmenu.php" target="_blank" rel="noopener noreferrer">Официальный выбор предмета обращения ↗</a></li><li><a href="https://www.ksrf.ru/about/legalbases/FCLM/Article96.php" target="_blank" rel="noopener noreferrer">Статья 96 — право на обращение ↗</a></li><li><a href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Полный алгоритм КС РФ ↗</a></li></ul>
   </details>
  </section>
 </article>;
}
