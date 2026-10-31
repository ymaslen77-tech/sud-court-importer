import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {
 MOSCOW_JUDGE_PROFILES,moscowJudgeProfile,moscowJudgeCases,
 moscowJudgeCaseCategories,moscowJudgeSourceLabel,moscowJudgeHref
} from '../../../../../lib/moscow-judge-directory';

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
const proceedingLabel=(c:'civil'|'criminal'|'criminal-materials')=>
 c==='civil'?'Гражданское судопроизводство (ГПК РФ)':c==='criminal'?
 'Уголовное судопроизводство (УПК РФ)':'Уголовные процессуальные материалы (УПК РФ)';

export default async function MoscowJudgeProfilePage({params}:Params){
 const {courtSlug,judgeSlug}=await params;
 const judge=moscowJudgeProfile(courtSlug,judgeSlug);
 if(!judge)notFound();
 const cases=moscowJudgeCases(courtSlug,judge.name);
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
    <p><strong>Судопроизводство:</strong> {proceedingLabel(c.proceeding)}</p>
    <p><strong>Категория:</strong> {c.category}</p>
    <p><strong>Результат:</strong> {c.status==='outcome_recorded'?c.outcome:'Результат пока не подтверждён'}
     {c.decisionDate?' · '+c.decisionDate:''}</p>
    <p><strong>Тип подтверждения:</strong> запись в официальном реестре, содержащая номер дела и ФИО судьи.</p>
    <p className="court-source">{c.note} Полный текст судебного акта и его мотивировка не проверены.</p>
    <a href={c.sourceUrl} rel="noopener noreferrer" target="_blank">Официальный реестр: проверить по номеру дела ↗</a>
   </article>)}</div>:<p>Проверенных персонально привязанных записей пока нет. Перейдите к официальному реестру и введите фамилию с инициалами и год.</p>}
   <div className="moscow-registry-summary">
    <div><strong>{cases.length}</strong><span>Записей в нашей выборке</span></div>
    <div><strong>{outcomes.length}</strong><span>Результатов по реестру</span></div>
    <div><strong>0</strong><span>Проверенных полных текстов в этой подборке</span></div>
   </div>
   <p><a href="https://mos-gorsud.ru/search" target="_blank" rel="noopener noreferrer">Поиск других дел на официальном портале ↗</a></p>
   <p className="court-source">Доля удовлетворённых требований, процент отмен решений и «вероятность исхода» не рассчитываются: выборка неполна, виды дел различаются. Удовлетворение ходатайства об обыске или аресте не является признанием лица виновным.</p>
  </section>
  {otherJudges.length>0?<section className="court-section">
   <h2>Другие опубликованные судьи этого суда</h2>
   <div className="court-practical-grid">{otherJudges.map(p=><article key={p.judgeSlug}>
    <h3>{p.name}</h3><Link href={moscowJudgeHref(p)} className="text-link">Сведения и проверенные дела →</Link>
   </article>)}</div>
  </section>:null}
 </article>;
}
