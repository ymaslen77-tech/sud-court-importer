import Link from 'next/link';
import {moscowPublishedLeadership} from '../lib/moscow-district-published-leadership';

export function MoscowDistrictPublishedLeader({slug}:{slug:string}){
 const fact=moscowPublishedLeadership(slug);
 if(!fact)return null;
 const role=fact.positionAsPublished==='acting'?'Исполняющий обязанности председателя (по публикации)':
  fact.positionAsPublished==='status_disputed'?'Руководство суда (статус требует сверки)':
  'Председатель суда (по опубликованным сведениям)';
 return <section className="court-section" id="moscow-published-leadership">
  <span className="eyebrow">Официально опубликованные сведения о руководстве</span>
  <h2>Председатель и руководство суда</h2>
  <dl className="court-facts">
   <div><dt>{role}</dt><dd>{fact.name}</dd></div>
   {fact.expeditionPhone?<div><dt>Экспедиция — телефон из официальной справки</dt><dd><a href={'tel:'+fact.expeditionPhone.replace(/[^+\d]/g,'')}>{fact.expeditionPhone}</a></dd></div>:null}
  </dl>
  {fact.notice?<p className="notice">{fact.notice}</p>:null}
  <p className="court-source">Сведения опубликованы на странице суда и изучены {fact.observedOn}.
   Наличие имени в справке не подтверждает актуальность назначения, полномочия и возможность личного приёма.</p>
  <p><Link href="/courts/moscow/judges" className="text-link">Судьи и сведения о делах на нашем сайте →</Link></p>
  <details><summary>Проверить официальный источник сведений</summary>
   <a href={fact.sourceUrl} rel="noopener noreferrer" target="_blank">Официальная страница суда ↗</a>
  </details>
 </section>;
}
