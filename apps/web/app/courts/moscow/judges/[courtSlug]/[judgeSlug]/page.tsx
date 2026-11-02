import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {
 MOSCOW_JUDGE_PROFILES,moscowJudgeProfile,moscowJudgeCases,
 moscowJudgeCaseCategories,moscowJudgeSourceLabel,moscowJudgeHref
} from '../../../../../lib/moscow-judge-directory';
import {moscowJudgeReviewedDecisions} from '../../../../../lib/moscow-judge-reviewed-decisions';
import {moscowJudgeVerifiedCrosschecks} from '../../../../../lib/moscow-judge-crosschecks';
import {moscowJudgeAppointmentEvents} from '../../../../../lib/moscow-judge-appointment-events';
import {moscowJudicialSourceConflict} from '../../../../../lib/moscow-judicial-discrepancies';

type Params={params:Promise<{courtSlug:string;judgeSlug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
 return MOSCOW_JUDGE_PROFILES.map(p=>({courtSlug:p.courtSlug,judgeSlug:p.judgeSlug}));
}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {courtSlug,judgeSlug}=await params;
 const judge=moscowJudgeProfile(courtSlug,judgeSlug);
 if(!judge)return {title:'Судья не найден',robots:{index:false,follow:false}};
 return {
  title:judge.name+' — дела, решения, категории права | '+judge.courtName,
  description:'Официальные сведения о '+judge.name+': суд, публикации, связанные дела, категории права и результаты только из проверенных судебных реестров.',
  robots:{index:false,follow:true},
  alternates:{canonical:moscowJudgeHref(judge)}
 };
}
const proceedingLabel=(c:'civil'|'civil-exec'|'criminal'|'criminal-materials')=>
 c==='civil'?'Гражданское судопроизводство (ГПК РФ)':c==='civil-exec'?'Гражданское производство — стадия исполнения':c==='criminal'?
 'Уголовное судопроизводство (УПК РФ)':'Уголовные процессуальные материалы (УПК РФ)';

export default async function MoscowJudgeProfilePage({params}:Params){
 const {courtSlug,judgeSlug}=await params;
 const judge=moscowJudgeProfile(courtSlug,judgeSlug);
 if(!judge)notFound();
 const cases=moscowJudgeCases(courtSlug,judge.name);
 const reviewed=moscowJudgeReviewedDecisions(courtSlug,judge.name);
 const crosschecked=moscowJudgeVerifiedCrosschecks(courtSlug,judge.name);
 const appointmentEvents=moscowJudgeAppointmentEvents(courtSlug,judge.name);
 const sourceConflict=moscowJudicialSourceConflict(courtSlug,judge.name);
 const categories=moscowJudgeCaseCategories(cases);
 const outcomes=cases.filter(c=>c.status==='outcome_recorded');
 const otherJudges=MOSCOW_JUDGE_PROFILES.filter(p=>p.courtSlug===courtSlug&&p.judgeSlug!==judgeSlug).slice(0,8);
 return <article className="moscow-judge-profile">
  <nav className="breadcrumb">
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>
   <Link href="/courts/moscow/judges">Судьи</Link><span>/</span>
   {judge.name}
  </nav>
  <section className="section-hero">
   <span className="kicker">Персональное справочное досье судьи</span>
   <h1>{judge.name}</h1>
   <p className="lead">{judge.courtName}</p>
   <p>{moscowJudgeSourceLabel(judge.sourceKind)}. Дата обновления источника: {judge.sourceUpdatedOn??'не указана'}. Источник просмотрен {judge.sourceObservedOn}.</p>
   {judge.sourceKind==='official_assistant_reference'?
    <p className="notice">ФИО встречается в перечне помощников судей. Это не самостоятельное подтверждение действующих судейских полномочий.</p>:null}
   {judge.courtVisitNotice?<p className="notice"><strong>Уточните адрес посещения:</strong> {judge.courtVisitNotice}</p>:null}
   {sourceConflict?<div className="notice">
    <strong>Разночтение в официальных кадровых источниках</strong>
    <p>Районный суд указывает «{sourceConflict.publishedName}», Московский городской суд — «{sourceConflict.alternateSpelling}». {sourceConflict.resolution}</p>
    <p><a href={sourceConflict.courtSource} target="_blank" rel="noopener noreferrer">Сообщение районного суда ↗</a> · <a href={sourceConflict.cityCourtSource} target="_blank" rel="noopener noreferrer">Сообщение городского суда ↗</a></p>
   </div>:null}
   {appointmentEvents.length>0?<div className="notice" aria-label="Назначения, опубликованные после составления справочника">
    <strong>Датированные кадровые изменения</strong>
    <ul>{appointmentEvents.map(e=><li key={e.appointmentDate+'-'+e.eventType}>
     {e.eventType==='appointed_to_moscow_city_court'
      ?'Назначен(а) судьёй Московского городского суда'
      :'Назначен(а) председателем этого районного суда'} — {e.appointmentDate}, Указ Президента РФ № {e.decreeNumber}.
     <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"> Официальная публикация ↗</a>
    </li>)}</ul>
    {appointmentEvents.some(e=>e.eventType==='appointed_to_moscow_city_court')?
      <p>Важное уточнение: запись в старом составе районного суда может быть устаревшей. Новое назначение подтверждено указом; место службы и действующий кадровый статус сверяйте на официальных страницах.</p>:null}
   </div>:null}
   <p className="court-source">Публикация сведений о судье не удостоверяет, что он или она продолжает работать в этом суде. При необходимости подтвердите полномочия по действующим кадровым документам.</p>
   <p><a href={judge.sourceUrl} rel="noopener noreferrer" target="_blank">Официальная страница с упоминанием судьи ↗</a></p>
   {judge.appointmentBasis?<p><strong>Опубликованные сведения о назначении:</strong> {judge.appointmentBasis}</p>:null}
   <p><Link href={judge.courtHref} className="text-link">Адрес, контакты и подсудность суда →</Link></p>
  </section>
  <section className="court-section" id="judge-case-categories">
   <span className="eyebrow">Правовые категории · только подтверждённые связи</span>
   <h2>Какие категории дел присутствуют в исследованной выборке</h2>
   {categories.length?<div className="court-practical-grid">{categories.map(t=><article key={t.topicId}>
    <h3>{t.category}</h3><p>Записей: {t.total}; с опубликованным результатом: {t.withRecordedOutcome}.</p>
    <p className="court-source">Это число записей в нашей выборке, а не весь объём работы судьи.</p>
   </article>)}</div>:<p>В локально проверенной выборке пока нет дел, которые можно однозначно связать с этим судьёй. Это не означает отсутствия рассмотренных дел.</p>}
   <p>Статьи законов и правовая позиция определяются по содержанию конкретного судебного акта. Категория из реестра сама по себе не подтверждает применение конкретной нормы в решении.</p>
  </section>
  <section className="court-section" id="judge-verified-cases">
   <span className="eyebrow">Дела и процессуальные результаты</span>
   <h2>Дела, связанные с {judge.name}</h2>
   {cases.length?<div className="moscow-judge-case-cards">{cases.map(c=><article key={c.number}>
    <h3>Дело № {c.number}</h3>
    {c.uin?<p><strong>УИД:</strong> {c.uin}</p>:null}
    <p><strong>Судопроизводство:</strong> {proceedingLabel(c.proceeding)}</p>
    <p><strong>Категория:</strong> {c.category}</p>
    <p><strong>Результат:</strong> {c.status==='outcome_recorded'?c.outcome:'Результат пока не подтверждён'}
     {c.decisionDate?' · '+c.decisionDate:''}</p>
    <p><strong>Тип подтверждения:</strong> запись в официальном реестре, содержащая номер дела и ФИО судьи.</p>
    <p className="court-source">{c.note} Полный текст судебного акта и его мотивировка не проверены.</p>
    {crosschecked.filter(v=>v.caseNumber===c.number).map(v=><div className="court-source" key={v.uin}>
     <p><strong>Сверено по двум официальным реестрам:</strong> совпадают УИД {v.uin}, номер дела, судья и категория.
      Жалоба {v.appealDocket} зарегистрирована {v.appealRegisteredOn}. Результат апелляции в проверенной карточке не указан.</p>
     <p><strong>Источники:</strong> <a href={v.witnesses[0].sourceUrl} target="_blank" rel="noopener noreferrer">первая инстанция ↗</a>
      {' · '}<a href={v.witnesses[1].sourceUrl} target="_blank" rel="noopener noreferrer">апелляционный реестр ↗</a></p>
     <p>Это две реестровые записи одного официального портала, а не независимые публикации полного решения.</p>
    </div>)}
    <a href={c.sourceUrl} rel="noopener noreferrer" target="_blank">Официальный реестр: проверить по номеру дела ↗</a>
   </article>)}</div>:<p>Проверенных персонально привязанных записей пока нет. Перейдите к официальному реестру и введите фамилию с инициалами и год.</p>}
   <div className="moscow-registry-summary">
    <div><strong>{cases.length}</strong><span>Записей в нашей выборке</span></div>
    <div><strong>{outcomes.length}</strong><span>Результатов по реестру</span></div>
    <div><strong>{reviewed.length}</strong><span>Проверенных полных текстов в этой подборке</span></div>
   </div>
   <p><a href="https://mos-gorsud.ru/search" target="_blank" rel="noopener noreferrer">Поиск других дел на официальном портале ↗</a></p>
   <p className="court-source">Доля удовлетворённых требований, процент отмен решений и «вероятность исхода» не рассчитываются: выборка неполна, виды дел различаются. Удовлетворение ходатайства об обыске или аресте не является признанием лица виновным.</p>
  </section>
  {crosschecked.length>0?<section className="court-section" id="judge-crosschecked-records">
   <span className="eyebrow">Сверка нескольких официальных реестров</span>
   <h2>Подтверждённые связи первой инстанции и апелляции</h2>
   <p>По {crosschecked.length} делу/делам номер, УИД и судья подтверждены отдельными записями первой и апелляционной инстанций.
   Это позволяет подтвердить прохождение жалобы, но не результат её рассмотрения или мотивировочную часть решения.</p>
  </section>:null}
  <section className="court-section" id="judge-reasoned-decisions">
   <span className="eyebrow">Правовые нормы и мотивы только по полному тексту</span>
   <h2>Проверенные мотивировочные решения</h2>
   {reviewed.length?<div className="court-practical-grid">{reviewed.map(r=><article key={r.caseNumber}>
    <h3>Дело № {r.caseNumber}</h3>
    <p><strong>Дата акта:</strong> {r.decisionDate}. <strong>Верификация текста:</strong> {r.reviewedOn}.</p>
    <p>{r.judicialReasoningSummary}</p>
    <ul>{r.legalNorms.map(n=><li key={n.law+'-'+n.article}>
     <strong>{n.law}, {n.article}</strong> — {n.reasoning}
    </li>)}</ul>
    <p className="court-source">Проверен полный текст официального акта. SHA-256: {r.officialFileSha256}.</p>
    <p className="court-source">{r.appealStatus==='not_checked'?'Наличие и результат апелляции не проверялись.':'Сведения об апелляции требуют просмотра в карточке дела.'}</p>
    <a href={r.courtCaseUrl} target="_blank" rel="noopener noreferrer">Официальная карточка судебного акта ↗</a>
   </article>)}</div>:<p>Пока ни один мотивировочный текст в подборке этого судьи не прошёл полную проверку. Категории и результаты выше взяты из официальных карточек дел, но не являются анализом правовой позиции.</p>}
  </section>
  {otherJudges.length>0?<section className="court-section">
   <h2>Другие опубликованные судьи этого суда</h2>
   <div className="court-practical-grid">{otherJudges.map(p=><article key={p.judgeSlug}>
    <h3>{p.name}</h3><Link href={moscowJudgeHref(p)} className="text-link">Сведения и проверенные дела →</Link>
   </article>)}</div>
  </section>:null}
 </article>;
}
