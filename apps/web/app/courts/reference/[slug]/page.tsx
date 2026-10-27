import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {officialReferenceCourt} from '../../../lib/official-reference-courts';
import {findCategory} from '../../../lib/court-taxonomy';
import {YandexCourtMap} from '../../../_components/yandex-court-map';

type Props={params:Promise<{slug:string}>};
export const dynamic='force-dynamic';

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const court=officialReferenceCourt((await params).slug);
 if(!court)return {title:'Суд не найден',robots:{index:false,follow:false}};
 return {
  title:court.name+' — адрес, карта и официальные материалы',
  description:court.name+'. Адрес и контакты из официальных судебных публикаций, карта и переход к делам.',
  robots:{index:false,follow:true}
 };
}
export default async function OfficialCourtReferencePage({params}:Props){
 const court=officialReferenceCourt((await params).slug);
 if(!court)notFound();
 return <>
  <div className="breadcrumb">
   <Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды России</Link><span>/</span>
   {court.region==='federal'?<Link href="/courts/types/constitutional">Федеральные суды</Link>:
    <Link href={'/courts/'+court.region}>{court.regionName}</Link>}
   <span>/</span>{court.name}
  </div>
  <section className="section-hero">
   <span className="kicker">Официальные справочные сведения · дата сверки источника 27.10.2026</span>
   <h1>{court.name}</h1>
   <p className="lead">{court.regionName} · {findCategory(court.kind)?.short}</p>
   <p className="notice">Это справочная карточка по опубликованному первоисточнику, а не редакционно принятая запись реестра. Перед обращением проверьте актуальность реквизитов на сайте суда.</p>
  </section>
  <div className="court-detail-grid">
   <section className="detail-card">
    <span className="eyebrow">Адрес и контакты из официальной публикации</span>
    <h2>Реквизиты суда</h2>
    <dl className="court-facts">
     <div><dt>Название</dt><dd>{court.name}</dd></div>
     <div><dt>Регион / уровень</dt><dd>{court.regionName}</dd></div>
     <div><dt>Адрес суда</dt><dd>{court.address}</dd></div>
     <div><dt>Контактный телефон</dt><dd>{court.phone}</dd></div>
     <div><dt>Электронная почта</dt><dd>{court.email}</dd></div>
     <div><dt>Источник</dt><dd><a href={court.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">Официальная публикация ↗</a></dd></div>
    </dl>
    <a href={court.officialUrl} target="_blank" rel="noopener noreferrer" className="button button-red">Открыть сайт суда ↗</a>
   </section>
   <aside className="detail-card detail-side">
    <span className="eyebrow">Компетенция</span>
    <h2>Какие дела рассматривает</h2>
    <p>{court.competence}</p>
    {court.kind==='constitutional'?<p>Конституционный Суд РФ — единственный федеральный суд этого вида; он расположен в Санкт-Петербурге и не является отдельным судом Алтайского края или иного субъекта РФ.</p>:null}
    <p>Конкретную подсудность определяют по виду производства, сторонам и нормам процессуального законодательства.</p>
    <Link className="text-link" href="/jurisdiction">Проверить подсудность →</Link>
   </aside>
  </div>
  <YandexCourtMap code={'public-'+court.slug} name={court.name} address={court.address}/>
  <section className="section-wrap">
   <div className="section-intro">
    <span className="eyebrow">Дела и судебные решения</span>
    <h2>Официальное судебное делопроизводство</h2>
    <p>Дела и тексты решений не перенесены в нашу базу без индивидуальной проверки. Для поиска дела, движения производства и опубликованных судебных актов используйте официальный сервис.</p>
   </div>
   <div className="results">
    <a className="result-row" href={court.casesUrl} target="_blank" rel="noopener noreferrer">
     <span><strong>Открыть официальный поиск дел и решений</strong><small>Первоисточник суда, а не неподтверждённые записи</small></span><span aria-hidden="true">↗</span>
    </a>
   </div>
  </section>
  <section className="section-wrap">
   <div className="section-intro">
    <span className="eyebrow">Судьи и состав суда</span>
    <h2>Действующий состав</h2>
    <p>Именные сведения не публикуются без отдельной сверки официального состава и оснований полномочий. Сведения о составе проверяйте в первоисточнике.</p>
   </div>
   <a className="text-link" href={court.judgesUrl??court.officialUrl} target="_blank" rel="noopener noreferrer">Официальный сайт суда и сведения о составе ↗</a>
  </section>
  <section className="callout">
   <div><span className="eyebrow">Возврат к каталогу</span><h2>Найти другие суды</h2>
    <p>Проверяйте вид суда и его территориальную компетенцию. Судебный регион не всегда совпадает с территорией действия вышестоящей инстанции.</p></div>
   <Link className="button button-outline" href={court.region==='federal'?'/courts':'/courts/'+court.region}>Перейти к списку судов →</Link>
  </section>
 </>;
}
