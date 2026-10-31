import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {
 MGS_BASE,MGS_GUIDE_TOPICS,mgsGuideTopic,mgsGuideHref
} from '../../../../../../lib/moscow-city-court-guide';

type Props={params:Promise<{topic:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
 return MGS_GUIDE_TOPICS.map(topic=>({topic:topic.slug}));
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {topic:slug}=await params;
 const topic=mgsGuideTopic(slug);
 if(!topic)return {title:'Раздел не найден',robots:{index:false,follow:false}};
 return {title:topic.title+' — Московский городской суд',
  description:topic.lead,
  alternates:{canonical:mgsGuideHref(slug)},robots:{index:false,follow:true}};
}
export default async function MgsTopicPage({params}:Props){
 const {topic:slug}=await params;
 const topic=mgsGuideTopic(slug);
 if(!topic)notFound();
 const nextStep=slug==='jurisdiction'?'competence':slug==='competence'?'filing':null;
 const nextTopic=nextStep?mgsGuideTopic(nextStep):null;
 return <article className="moscow-minimum-court-page">
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>
   <Link href={MGS_BASE}>Московский городской суд</Link><span>/</span>{topic.shortTitle}
  </nav>
  <section className="section-hero">
   <span className="kicker">Мосгорсуд · подробный справочный раздел</span>
   <h1>{topic.title}</h1>
   <p className="lead">{topic.lead}</p>
   <p className="court-source">Проверено по официальным публикациям 31.10.2026. Независимый справочник; текущее состояние отдельных сведений уточняйте у суда.</p>
   <div className="court-filter-actions">
    <Link className="button button-outline" href={MGS_BASE}>← Основная карточка суда</Link>
    <a className="text-link" href="#mgs-topic-steps">Пошаговое руководство ↓</a>
   </div>
  </section>
  <section className="court-section" id="mgs-topic-explain">
   <span className="eyebrow">Разъяснения</span><h2>Что важно знать</h2>
   {topic.paragraphs.map((p,i)=><p key={i}>{p}</p>)}
  </section>
  <section className="court-section" id="mgs-topic-steps">
   <span className="eyebrow">Практический маршрут</span><h2>Что делать по порядку</h2>
   <ol className="ksrf-guide-list">
    {topic.steps.map((step,i)=><li key={step}><span>{String(i+1).padStart(2,'0')}</span><div><p>{step}</p></div></li>)}
   </ol>
  </section>
  {slug==='jurisdiction'?<section className="court-section" id="mgs-official-territorial">
   <span className="eyebrow">Внешний официальный сервис</span>
   <h2>Определить районный суд по московскому адресу</h2>
   <p>В официальном поиске начните вводить улицу, выберите её из подсказок, укажите дом и при наличии корпус и строение. В результате определите районный суд. Проверка по адресу не устанавливает автоматически подсудность дела Московскому городскому суду: для этого учитывайте категорию дела и инстанцию.</p>
   <p><a className="button button-red" href="https://mos-gorsud.ru/territorial" target="_blank" rel="noopener noreferrer">Открыть официальный сервис подсудности ↗</a></p>
   <p className="court-source">Не вводите ФИО, квартиру и иные лишние персональные данные.</p>
  </section>:null}
  {nextTopic?<section className="court-section" id="mgs-next-step">
   <span className="eyebrow">Маршрут · следующий шаг</span>
   <h2>{nextTopic.shortTitle}</h2>
   <p>{nextTopic.lead}</p>
   <Link className="button button-red" href={mgsGuideHref(nextTopic.slug)}>Перейти к следующему этапу →</Link>
  </section>:null}
  <section className="court-section" id="mgs-topic-related">
   <span className="eyebrow">Внутренняя навигация</span><h2>Следующие полезные разделы</h2>
   <div className="court-practical-grid">{topic.related.map(s=>{
    const item=mgsGuideTopic(s);
    return item?<article key={s}><h3>{item.shortTitle}</h3><p>{item.lead}</p>
     <Link className="text-link" href={mgsGuideHref(s)}>Изучить раздел →</Link></article>:null;
   })}</div>
   <p><Link href={MGS_BASE} className="text-link">Все восемь разделов карточки →</Link></p>
  </section>
  <section className="court-section" id="mgs-topic-sources">
   <span className="eyebrow">Первоисточники</span><h2>Проверить информацию на официальном портале</h2>
   <p>Первоисточники доступны без обязательных переходов по внутренним страницам. Рекомендуемый путь помогает разобраться в вопросе, но не ограничивает доступ к официальному сайту.</p>
   <ul>{topic.sources.map(source=><li key={source.url}>
    <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>
   </li>)}</ul>
  </section>
 </article>;
}
