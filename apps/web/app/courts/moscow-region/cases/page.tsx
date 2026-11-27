import Link from 'next/link';
import type {Metadata} from 'next';
import {MoscowRegionCaseExplorer} from '../../../_components/moscow-region-case-explorer';
import {MOSCOW_REGION_COURTS,MOSCOW_REGION_CASES,
 MOSCOW_OBLAST_LISTING_SOURCE,MOSCOW_OBLAST_LISTING_DATE} from '../../../lib/moscow-region-case-index';

export const metadata:Metadata={
 title:'Судебные дела Москвы и Московской области — поиск по номеру, категории и суду',
 description:'Подборка опубликованных судебных записей по Москве и Московской области с прямыми ссылками на официальные судебные порталы и указанием ограничений проверки.',
 robots:{index:false,follow:true},
 alternates:{canonical:'/courts/moscow-region/cases'}
};
type Props={searchParams:Promise<{q?:string|string[];region?:string|string[];court?:string|string[]}>};
export default async function MoscowAndOblastCases({searchParams}:Props){
 const p=await searchParams;
 const query=typeof p.q==='string'?p.q.trim().slice(0,100):'';
 const region=p.region==='moscow'||p.region==='region-50'?p.region:'';
 const requestedCourt=typeof p.court==='string'?p.court:'';
 const selectedCourt=MOSCOW_REGION_COURTS.some(c=>c.region+':'+c.slug===requestedCourt&&(!region||c.region===region))?requestedCourt:'';
 const moscow=MOSCOW_REGION_CASES.filter(c=>c.region==='moscow').length;
 const oblast=MOSCOW_REGION_CASES.filter(c=>c.region==='region-50').length;
 const oblastCourts=MOSCOW_REGION_COURTS.filter(c=>c.region==='region-50');
 return <>
  <nav className="breadcrumb" aria-label="Навигация">
    <Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link>
    <span>/</span>Дела Москвы и Московской области
  </nav>
  <section className="section-hero">
   <span className="kicker">Судебные дела · два отдельных субъекта РФ</span>
   <h1>Судебные дела Москвы и Московской области</h1>
   <p className="lead">Найдите номер дела, суд или категорию спора. Показываем только сведения из вручную отобранных официальных публикаций, а не все судебные производства двух регионов.</p>
   <div className="moscow-registry-summary">
    <div><strong>{moscow}</strong><span>Записей из судебных реестров Москвы</span></div>
    <div><strong>{oblast}</strong><span>Исторических областных апелляционных записей</span></div>
    <div><strong>{oblastCourts.length}</strong><span>Справочных карточек областных судов для перехода к официальным источникам</span></div>
   </div>
   <p className="notice" role="note">Москва и Московская область имеют разные судебные справочники. Подтверждение наличия дела в реестре не означает проверки полного текста решения, вступления акта в силу или результата обжалования.</p>
   <nav className="court-toc" aria-label="Разделы поиска">
     <strong>Быстрые переходы</strong>
     <a href="#regional-case-search">Найти дело в подборке</a>
     <a href="#official-regional-case-portals">Официальные реестры дел</a>
     <Link href="/courts/moscow">35 районных судов Москвы</Link>
     <Link href="/courts/region-50">Суды Московской области</Link>
   </nav>
  </section>
  <div id="regional-case-search">
   <MoscowRegionCaseExplorer cases={MOSCOW_REGION_CASES}
    courts={MOSCOW_REGION_COURTS} initialQuery={query} initialRegion={region} initialCourt={selectedCourt}/>
  </div>
  <section className="court-section" id="official-regional-case-portals">
    <h2>Официальные источники — для полного поиска</h2>
    <div className="court-practical-grid">
     <article>
      <h3>Москва</h3>
      <p>Единый официальный поиск Мосгорсуда позволяет уточнить номер, инстанцию и категорию. Для конкретного дела необходимо проверить актуальную карточку.</p>
      <a href="https://mos-gorsud.ru/search" target="_blank" rel="noopener noreferrer">Открыть официальный поиск Москвы ↗</a>
     </article>
     <article>
      <h3>Московская область</h3>
      <p>Для Московского областного суда доступен официальный раздел делопроизводства. По районным и городским судам используйте официальные сайты из регионального справочника. Прямая ссылка на форму подтверждена не для каждого суда.</p>
      <a href="https://oblsud--mo.sudrf.ru/modules.php?name=sud_delo" target="_blank" rel="noopener noreferrer">Делопроизводство Московского областного суда ↗</a>
      <p><Link href="/courts/region-50">Найти областной суд по названию →</Link></p>
     </article>
    </div>
    <p className="court-source">Часть областных номеров и категорий взята из <a href={MOSCOW_OBLAST_LISTING_SOURCE} target="_blank" rel="noopener noreferrer">официального списка заседаний на {MOSCOW_OBLAST_LISTING_DATE}</a>. Список — исторический снимок, не актуальное расписание. Прямые карточки четырёх дел из этого списка отдельно прочитать не удалось. Дополнительные записи из сохранённых копий официальных карточек имеют отдельную отметку; актуальность и исход не подтверждены. Фамилии сторон и сведения о закрытых производствах не переносились.</p>
  </section>
 </>;
}
