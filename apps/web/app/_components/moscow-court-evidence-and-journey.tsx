import Link from 'next/link';
import {MOSCOW_JUDGE_CASE_EVIDENCE,moscowJudgeProfilesForCourt,moscowJudgeHref,
  moscowJudgeSourceLabel} from '../lib/moscow-judge-directory';
import {moscowCourtPracticalFacts,MOSCOW_PRACTICAL_SNAPSHOT_DATE} from '../lib/moscow-district-practical-facts';

type Props={officialSlug:string;courtName:string};

/** Common, sourced research pathway for ALL 35 Moscow district courts.
 * No inferred employment status, win rates, invented cases, or mandatory
 * click-gates before a primary source. Existing court page stays canonical.
 */
export function MoscowCourtEvidenceAndJourney({officialSlug,courtName}:Props){
 const all=moscowJudgeProfilesForCourt(officialSlug);
 const unique=new Map(all.map(p=>[p.judgeSlug,p]));
 const judges=[...unique.values()].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 const cases=MOSCOW_JUDGE_CASE_EVIDENCE.filter(c=>c.courtSlug===officialSlug);
 const results=cases.filter(c=>c.status==='outcome_recorded');
 const extras=moscowCourtPracticalFacts(officialSlug);
 const caseRows=cases.slice(0,6);
 return <>
  <section className="court-section" id="moscow-research-route">
   <span className="eyebrow">Исследование суда внутри портала</span>
   <h2>От карточки суда — к судье, категории дела и судебной записи</h2>
   <p>Все переходы ниже ведут на разделы нашего сайта. Вы можете изучить сведения без перехода на другие ресурсы,
    а первоисточники доступны непосредственно у соответствующих фактов, без обязательных дополнительных страниц.</p>
   <nav className="court-toc" aria-label={'Навигация по сведениям: '+courtName}>
    <strong>Продолжить изучение</strong>
    <Link href="/courts/moscow">01. Все суды Москвы</Link>
    <Link href="/jurisdiction">02. Подсудность и виды дел</Link>
    <Link href="/courts/moscow/judges">03. Судьи и категории дел</Link>
    {judges[0]?<Link href={moscowJudgeHref(judges[0])}>04. Пример индивидуального досье судьи</Link>:<Link href="/courts/moscow/judges">04. Найти судью по опубликованным сведениям</Link>}
    <Link href="/courts/moscow/registry/moscow-city-court/info/appeals">05. Обжалование в Московском городском суде</Link>
    <Link href="/services">06. Документы и юридические сервисы</Link>
   </nav>
   <div className="court-practical-grid">
    <article><h3>Судьи в собранных публикациях</h3><p>{judges.length} {judges.length===1?'имя':'ФИО'} из официальных списков, сообщений о назначении или иных датированных упоминаний. Это не полный штат на сегодня.</p>
     <p><Link href="/courts/moscow/judges" className="text-link">Перейти к каталогу судей →</Link></p></article>
    <article><h3>Дела в исследовательской выборке</h3><p>{cases.length} записей по этому суду, включая {results.length} с опубликованным результатом. Это не все дела суда и не статистика успешности сторон.</p>
     <p><Link href="/courts/moscow/judges" className="text-link">Выбрать судью и категорию →</Link></p></article>
   </div>
   {judges.length>0?<div>
     <h3>ФИО из официальных кадровых публикаций</h3>
     <p className="court-source">Дата каждой публикации указана в индивидуальном досье. Имя в историческом списке не подтверждает текущие полномочия.</p>
     <div className="results">{judges.slice(0,8).map(person=>
       <Link key={person.judgeSlug} className="result-row" href={moscowJudgeHref(person)}>
        <span><strong>{person.name}</strong><small>{moscowJudgeSourceLabel(person.sourceKind)}</small></span>
        <span aria-hidden="true">→</span>
       </Link>
     )}</div>
     {judges.length>8?<p><Link href="/courts/moscow/judges" className="text-link">Открыть поиск по остальным опубликованным именам →</Link></p>:null}
    </div>:<p className="court-source">Для этого суда пока нет достаточного индивидуально подтверждённого списка. Не подставляем неизвестные имена.</p>}
   {caseRows.length>0?<div>
    <h3>Примеры судебных записей этого суда</h3>
    <p>Категория и результат приведены только в том объёме, который подтверждает сохранённая официальная запись; полный текст и мотивировка не проверены.</p>
    <div className="court-practical-grid">{caseRows.map(item=>{
     const related=judges.find(p=>p.name===item.judgeName);
     return <article key={item.number+'-'+item.judgeName}>
      <h4>Дело № {item.number}</h4>
      <p><strong>Категория:</strong> {item.category}</p>
      <p><strong>Реестровый результат:</strong> {item.status==='outcome_recorded'?item.outcome:'Не подтверждён'}</p>
      {related?<p><Link href={moscowJudgeHref(related)}>Досье судьи: {related.name} →</Link></p>:null}
      <p className="court-source">Исследовано: {item.observedOn}. Полный текст акта не проверен.</p>
      <details><summary>Официальный источник этой записи</summary>
       <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Проверить запись на портале суда ↗</a>
      </details>
     </article>;
    })}</div>
   </div>:null}
  </section>
  {extras?<section className="court-section" id="moscow-specific-visiting">
   <span className="eyebrow">Дополнительные сведения · индивидуальная официальная справка</span>
   <h2>Доступность и приём подразделений: {courtName}</h2>
   <p>Это сведения опубликованной страницы суда, изученной {MOSCOW_PRACTICAL_SNAPSHOT_DATE}.
      {extras.sourceUpdatedOn?' Дата последнего обновления первоисточника: '+extras.sourceUpdatedOn+'.':''}
      Перед посещением уточните время и актуальность телефона.</p>
   <dl className="court-facts">
    {extras.accessiblePhone?<div><dt>Телефон для маломобильных посетителей</dt><dd>{extras.accessiblePhone}</dd></div>:null}
    {extras.anticorruptionPhone?<div><dt>Телефон доверия по вопросам коррупции</dt><dd>{extras.anticorruptionPhone}</dd></div>:null}
    {extras.travel?<div><dt>Как добраться по опубликованной инструкции</dt><dd>{extras.travel}</dd></div>:null}
   </dl>
   {extras.serviceHours.length>0?<div>
    <h3>Часы и телефоны отдельных подразделений</h3>
    <div className="court-practical-grid">{extras.serviceHours.map(item=>
     <article key={item.label}><h4>{item.label}</h4><p>{item.schedule}</p>
      {item.phone?<p><strong>Контакт:</strong> {item.phone}</p>:null}
     </article>
    )}</div>
   </div>:null}
   {extras.notes.map(note=><p className="court-source" key={note}>{note}</p>)}
   <p className="court-source">Эти номера — справочные и специализированные линии, а не способы процессуальной подачи документов.</p>
   <details><summary>Первоисточник контактов и часов приёма</summary>
    <a href={extras.sourceUrl} target="_blank" rel="noopener noreferrer">
      Официальная страница «Контакты и часы приёма» суда ↗</a>
   </details>
  </section>:null}
 </>;
}
