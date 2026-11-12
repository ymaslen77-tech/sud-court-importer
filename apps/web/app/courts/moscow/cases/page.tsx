import Link from 'next/link';
import type {Metadata} from 'next';
import {MoscowCaseIndexExplorer, type IndexedMoscowCase} from '../../../_components/moscow-case-index-explorer';
import {MOSCOW_JUDGE_CASE_EVIDENCE,MOSCOW_JUDGE_PROFILES,moscowJudgeHref,moscowJudgeSlug} from '../../../lib/moscow-judge-directory';
import {moscowJudgeCaseCrosscheck} from '../../../lib/moscow-judge-crosschecks';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS} from '../../../lib/moscow-official-minimum';

export const metadata:Metadata={
 title:'Поиск дел районных судов Москвы — номера, категории, судьи | Суды России',
 description:'Поиск в локальной подборке официальных судебных записей Москвы по номеру, категории, суду и судье с проверяемыми первоисточниками.',
 robots:{index:false,follow:true},
 alternates:{canonical:'/courts/moscow/cases'}
};

export default function MoscowCasesIndexPage(){
 const courts=MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>c.kind==='general-district')
  .map(c=>({slug:c.slug,name:c.name})).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 const entries:IndexedMoscowCase[]=MOSCOW_JUDGE_CASE_EVIDENCE.map(item=>{
  const judge=MOSCOW_JUDGE_PROFILES.find(p=>p.courtSlug===item.courtSlug
   &&p.judgeSlug===moscowJudgeSlug(item.judgeName));
  const appeal=moscowJudgeCaseCrosscheck(item.courtSlug,item.number);
  return {...item,judgeHref:judge?moscowJudgeHref(judge):null,
   appealDocket:appeal?.appealDocket??null,
   appealRegisteredOn:appeal?.appealRegisteredOn??null};
 });
 return <main className="moscow-judge-directory">
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>Поиск дел
  </nav>
  <section className="section-hero">
   <span className="kicker">Официально опубликованные сведения · районные суды Москвы</span>
   <h1>Поиск судебных дел Москвы</h1>
   <p className="lead">Номер дела, суд, судья и категория — в одном поиске по имеющейся у нас подборке. Каждая карточка содержит дату просмотра и ссылку на первоисточник.</p>
   <div className="notice" role="note">Здесь нет полного архива решений всех московских судов. Реестровые результаты нельзя считать изученными судебными решениями. Сведения об участниках дел и тексты актов не копируются.</div>
   <p><Link href="/courts/moscow/judges" className="text-link">Перейти к подробному каталогу судей →</Link></p>
  </section>
  <MoscowCaseIndexExplorer courts={courts} cases={entries}/>
  <section className="court-section">
   <h2>Как продолжить проверку дела</h2>
   <ol>
    <li>Найдите номер и нужный районный суд в подборке, либо воспользуйтесь официальным поиском, если записи здесь нет.</li>
    <li>Откройте внутренний раздел делопроизводства выбранного суда: там описано, как проверить движение дела, извещение и место заседания.</li>
    <li>Отдельно уточните, опубликован ли полный текст решения и допускается ли его размещение.</li>
    <li>Для обжалования изучите порядок пересмотра применительно к виду судопроизводства и конкретному акту.</li>
   </ol>
   <p><Link href="/courts/moscow" className="text-link">Все 35 районных судов и Московский городской суд →</Link></p>
   <p><a href="https://mos-gorsud.ru/search" rel="noopener noreferrer" target="_blank">Официальный поиск дел судов Москвы ↗</a></p>
  </section>
 </main>;
}
