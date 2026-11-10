import Link from 'next/link';
import {moscowJudgeAppointmentEvents} from '../lib/moscow-judge-appointment-events';
import {
 MOSCOW_JUDGE_PROFILES,MOSCOW_JUDGE_CASE_EVIDENCE,
 moscowJudgeProfilesForCourt,moscowJudgeHref,moscowJudgeSlug,
 moscowJudgeSourceLabel
} from '../lib/moscow-judge-directory';

type JudgeSource=typeof MOSCOW_JUDGE_PROFILES[number];

const SOURCE_ORDER={
 official_roster:0,
 official_appointment_news:1,
 official_chair_listing:2,
 official_assistant_reference:3
} as const;

function publishedJudges(courtSlug:string){
 const byName=new Map<string,JudgeSource>();
 for(const person of moscowJudgeProfilesForCourt(courtSlug)){
  const previous=byName.get(person.judgeSlug);
  if(!previous||SOURCE_ORDER[person.sourceKind]<SOURCE_ORDER[previous.sourceKind]){
   byName.set(person.judgeSlug,person);
  }
 }
 return [...byName.values()].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
}

/** An evidence-level public roster, never a statement of currently serving
 * judges. Names are source-bound; assistant listings are labeled as such.
 */
export function MoscowCourtPublishedJudges({courtSlug}:{courtSlug:string}){
 const people=publishedJudges(courtSlug);
 const hasRoster=people.some(p=>p.sourceKind==='official_roster');
 return <div id="moscow-judges-published">
  <h3>Имена судей из официальных публикаций</h3>
  {people.length?<><p>В нашем справочнике приведено {people.length} {people.length===1?'имя':'имён'} из опубликованных списков, сообщений о назначениях и кадровых справок именно этого суда.
   {hasRoster?' Есть опубликованный официальный список судей, но его актуальность на сегодня не гарантируется.':' Подтверждённый полный список судей пока не получен; перечисленные ниже сведения носят выборочный характер.'}
   Историческая публикация не удостоверяет, что каждый человек продолжает занимать должность в этом суде.</p>
   <div className="results">
    {people.map(person=>{const transfer=moscowJudgeAppointmentEvents(courtSlug,person.name)
      .find(e=>e.eventType==='appointed_to_moscow_city_court');
     return <article className="result-row" key={person.judgeSlug}>
     <span><strong><Link href={moscowJudgeHref(person)}>{person.name} →</Link></strong>
      <small>{moscowJudgeSourceLabel(person.sourceKind)}</small>
      {person.appointmentBasis?<small>Указанное основание: {person.appointmentBasis}</small>:null}
      {transfer?<small><strong>Позднейшее кадровое событие:</strong> {transfer.appointmentDate} опубликовано назначение в Московский городской суд. Не считайте эту историческую запись подтверждением работы в районном суде сегодня.</small>:null}
      {person.sourceUpdatedOn?<small>Дата обновления первоисточника: {person.sourceUpdatedOn}</small>:null}
      <small>Сведения просмотрены {person.sourceObservedOn}.</small>
      <details><summary>Официальный источник сведений</summary>
       <a href={person.sourceUrl} target="_blank" rel="noopener noreferrer">Проверить опубликованную запись ↗</a>
      </details>
     </span>
    </article>;})}
   </div>
  </>:<p>Для этого суда пока не найдены индивидуальные записи судей, прошедшие проверку официального происхождения. Это не означает отсутствие действующих судей.</p>}
  <p><Link href="/courts/moscow/judges" className="text-link">Каталог судей Москвы, поиск по имени и категории дела →</Link></p>
 </div>;
}

export function MoscowCourtPublishedCases({courtSlug}:{courtSlug:string}){
 const cases=MOSCOW_JUDGE_CASE_EVIDENCE.filter(item=>item.courtSlug===courtSlug)
  .sort((a,b)=>(b.decisionDate??b.observedOn).localeCompare(a.decisionDate??a.observedOn))
  .slice(0,12);
 const people=publishedJudges(courtSlug);
 return <div id="moscow-source-confirmed-cases">
  <h3>Дела, в которых опубликовано имя судьи и номер производства</h3>
  {cases.length?<><p>Показаны {cases.length} записей из проверенной локальной подборки.
   Это не все дела суда, не статистика результатов и не подборка мотивировочных текстов решений.</p>
   <div className="court-practical-grid">{cases.map(row=>{
    const judge=people.find(p=>moscowJudgeSlug(p.name)===moscowJudgeSlug(row.judgeName));
    return <article key={row.number+'-'+row.judgeName}>
     <h4>Дело № {row.number}</h4>
     <p><strong>Категория:</strong> {row.category}</p>
     {judge?<p><strong>Судья по опубликованной записи:</strong> <Link href={moscowJudgeHref(judge)}>{row.judgeName}</Link></p>:
      <p><strong>Судья по опубликованной записи:</strong> {row.judgeName}</p>}
     <p><strong>Результат по реестру:</strong> {row.status==='outcome_recorded'?row.outcome:'Не подтверждён'}</p>
     {row.decisionDate?<p><strong>Дата в судебной записи:</strong> {row.decisionDate}</p>:null}
     <p className="court-source">Источник просмотрен {row.observedOn}. Мотивировочный текст судебного акта и итог апелляции по этой записи не подтверждены.</p>
     <details><summary>Официальная судебная запись</summary>
      <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer">Проверить дело на портале суда ↗</a>
     </details>
    </article>;
   })}</div>
  </>:<p>Для данного суда в проверенной локальной подборке пока нет записей, где одновременно установлены судья, номер и источник дела. Отсутствие записи у нас не говорит об отсутствии производства в суде.</p>}
  <p className="court-source">Полные тексты и правовые выводы по этим делам не удостоверены: неподтверждённые мотивировки, цитаты и результаты апелляций не приводятся.</p>
  <p><Link className="text-link" href="/courts/moscow/judges">Перейти к каталогу судей и дел →</Link></p>
 </div>;
}
