import Link from 'next/link';
import type {Metadata} from 'next';
import {MoscowJudgesExplorer} from '../../../_components/moscow-judges-explorer';
import {MOSCOW_JUDGE_PROFILES,MOSCOW_JUDGE_CASE_EVIDENCE} from '../../../lib/moscow-judge-directory';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS,MoscowOfficialCourtHref} from '../../../lib/moscow-official-minimum';

export const metadata:Metadata={
 title:'Судьи районных судов Москвы — дела, категории и результаты | Суды России',
 description:'Выбор районного суда и судьи: официальные списки, категории дел, проверяемые результаты и ссылки на судебные реестры.',
 robots:{index:false,follow:true},
 alternates:{canonical:'/courts/moscow/judges'}
};

export default function MoscowJudgesDirectory(){
 const courts=MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>c.kind==='general-district').map(c=>({
  slug:c.slug,name:c.name,href:MoscowOfficialCourtHref(c)
 })).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 const rosterRows=courts.map(c=>{
  const profiles=MOSCOW_JUDGE_PROFILES.filter(p=>p.courtSlug===c.slug);
  const unique=new Set(profiles.map(p=>p.judgeSlug));
  const kinds=new Set(profiles.map(p=>p.sourceKind));
  const summary=kinds.has('official_roster')?'Есть опубликованный список судей':
   kinds.has('official_assistant_reference')?'Судьи упомянуты в справочнике помощников':
   kinds.has('official_appointment_news')?'Есть сообщения о назначениях':
   kinds.has('official_chair_listing')?'Есть опубликованные сведения о председателе':
   'Сведения о конкретных судьях требуют проверки';
  return {...c,numberOfMentions:unique.size,summary,hasRoster:kinds.has('official_roster')};
 });
 const publishedRosters=rosterRows.filter(c=>c.hasRoster).length;
 const distinctPublishedNames=new Set(MOSCOW_JUDGE_PROFILES.map(p=>p.courtSlug+'|'+p.judgeSlug)).size;
 const pending=MOSCOW_JUDGE_CASE_EVIDENCE.filter(c=>c.status==='pending').length;
 const outcomes=MOSCOW_JUDGE_CASE_EVIDENCE.filter(c=>c.status==='outcome_recorded').length;
 return <main className="moscow-judge-directory">
  <nav className="breadcrumb"><Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>Судьи</nav>
  <section className="section-hero">
   <span className="kicker">Карточки судей и подтверждённые судебные дела</span>
   <h1>Судьи районных судов Москвы</h1>
   <p className="lead">Выберите суд, судью и категорию права, чтобы увидеть, какие дела и результаты есть в проверенной выборке. Для каждой записи указан официальный первоисточник.</p>
   <p><Link href="/courts/moscow/cases" className="text-link">Искать дело по номеру, суду или категории без выбора судьи →</Link></p>
   <p className="court-source">Выбор судьи здесь предназначен только для изучения опубликованных сведений, а не для назначения судьи по вашему делу. Территориальная и родовая подсудность определяются для суда, а распределение дел между судьями осуществляется отдельно.</p>
   <div className="moscow-registry-summary">
    <div><strong>{courts.length}</strong><span>Районных судов в каталоге</span></div>
    <div><strong>{distinctPublishedNames}</strong><span>Уникальных сочетаний суд + ФИО в публикациях</span></div>
    <div><strong>{outcomes}</strong><span>Результатов в проверенной выборке</span></div>
   </div>
   <p className="court-source">Также в выборке {pending} дела без подтверждённого результата. Данные не образуют полный реестр всех дел или действующий штат судей.</p>
  </section>
  <section className="court-section" id="choose-judge">
   <h2>Выбор судьи и судебных дел</h2>
   <MoscowJudgesExplorer courts={courts} profiles={[...MOSCOW_JUDGE_PROFILES]} cases={[...MOSCOW_JUDGE_CASE_EVIDENCE]}/>
  </section>
  <section className="court-section" id="judges-by-court">
   <span className="eyebrow">Официально опубликованные сведения</span>
   <h2>Судьи по каждому из 35 районных судов Москвы</h2>
   <p>Для {publishedRosters} судов доступен опубликованный список судей. Для остальных судов показаны только те лица, которые названы в отдельных официальных сообщениях о назначениях, справочниках аппарата или на страницах руководства. Число имён ниже не равно штатной численности действующих судей.</p>
   <div className="results">{rosterRows.map(c=><article className="result-row" key={c.slug}>
    <span>
     <strong><Link href={c.href}>{c.name} →</Link></strong>
     <small>{c.summary}. Опубликованных индивидуальных записей: {c.numberOfMentions}.</small>
     <small><Link href={'/courts/moscow/registry/'+c.slug+'/info/judges'}>Судьи, назначение и первоисточники →</Link>
     {' · '}<Link href={'/courts/moscow/registry/'+c.slug+'/info/cases'}>Дела этого суда →</Link></small>
    </span>
   </article>)}</div>
   <p className="court-source">Исторический список не подтверждает актуальность назначения и распределение судебных дел. Для отдельных судей доступны страницы с датами и прямыми ссылками на официальные публикации.</p>
  </section>
  <section className="court-section">
   <h2>Как читать результаты</h2>
   <div className="court-practical-grid">
    <article><h3>Дела судьи</h3><p>Показываются лишь записи, в которых официальный источник одновременно указывает номер дела и судью. Отсутствие записей не говорит об отсутствии практики.</p></article>
    <article><h3>Категории права</h3><p>Группировка по виду судопроизводства и предмету дела из судебного реестра. Она не означает специализацию судьи или наличие конкретной правовой позиции.</p></article>
    <article><h3>Результаты</h3><p>Отдельно учитываются опубликованные результаты и дела, находящиеся в производстве. Удовлетворённое ходатайство следствия не означает обвинительный приговор.</p></article>
    <article><h3>Тексты решений</h3><p>Мотивировка, нормы права и правовая позиция добавляются только после проверки конкретного опубликованного акта. Сейчас полные тексты приведённых решений не проверены.</p></article>
   </div>
   <p>Официальный поиск дел охватывает больше записей, чем локальная исследовательская подборка. <a href="https://mos-gorsud.ru/search" rel="noopener noreferrer" target="_blank">Открыть полный поиск дел Москвы ↗</a></p>
   <p>Для дальнейшего исследования доступны <a href="https://data.mos-gorsud.ru/" rel="noopener noreferrer" target="_blank">официальные открытые данные судебной системы Москвы ↗</a> и <a href="https://sudact.ru/" rel="noopener noreferrer" target="_blank">неофициальный каталог судебных актов «СудАкт» ↗</a>. Сведения сторонних каталогов нельзя считать подтверждёнными без сверки номера дела, суда, судьи и судебного акта на официальном портале.</p>
  </section>
 </main>;
}
