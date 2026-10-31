import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getMoscowOfficialMinimumCourt} from '../../../../../../lib/moscow-official-minimum';
import {MOSCOW_DISTRICT_INDIVIDUALS,moscowDistrictIndividual,moscowDistrictOfficialPages} from '../../../../../../lib/moscow-district-individual';
import {MOSCOW_DISTRICT_TOPICS,moscowDistrictTopic,moscowDistrictTopicNext,moscowDistrictTopicHref} from '../../../../../../lib/moscow-district-topics';
import {moscowJudgeRoster,moscowCourtCaseExamples,moscowVerifiedOutcome} from '../../../../../../lib/moscow-district-source-evidence';
import {moscowJudicialSourceBrief} from '../../../../../../lib/moscow-judicial-source-briefs';
import {MoscowDistrictAddressLookup} from '../../../../../../_components/moscow-district-address-lookup';

type Params={params:Promise<{slug:string;topic:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
 return MOSCOW_DISTRICT_INDIVIDUALS.flatMap(c=>
  MOSCOW_DISTRICT_TOPICS.map(t=>({slug:c.slug,topic:t.slug})));
}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {slug,topic:topicSlug}=await params;
 const court=getMoscowOfficialMinimumCourt(slug);
 const topic=moscowDistrictTopic(topicSlug);
 if(!court||!topic||!moscowDistrictIndividual(slug))
  return {title:'Страница не найдена',robots:{index:false,follow:false}};
 const url=moscowDistrictTopicHref(slug,topic.slug);
 return {
  title:topic.title+' — '+court.name+' | Суды России',
  description:court.name+': '+topic.description,
  alternates:{canonical:url},
  robots:{index:false,follow:true},
  openGraph:{type:'article',title:topic.title+' — '+court.name,description:topic.description,url,locale:'ru_RU'}
 };
}
export default async function MoscowDistrictTopicPage({params}:Params){
 const {slug,topic:topicSlug}=await params;
 const court=getMoscowOfficialMinimumCourt(slug);
 const profile=moscowDistrictIndividual(slug);
 const topic=moscowDistrictTopic(topicSlug);
 if(!court||!profile||!topic||court.kind!=='general-district')notFound();
 const url=moscowDistrictTopicHref(slug,topic.slug);
 const next=moscowDistrictTopicNext(topic.slug);
 const firstThree=topic.order<=3&&topic.order>0;
 const official=moscowDistrictOfficialPages(profile);
 const roster=moscowJudgeRoster(slug);
 const brief=moscowJudicialSourceBrief(slug);
 const docket=moscowCourtCaseExamples(slug);
 const outcome=moscowVerifiedOutcome(slug);
 const hub='/courts/moscow/registry/'+slug;
 return <article className="moscow-minimum-court-page">
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>
   <Link href={hub}>{court.name}</Link><span>/</span>{topic.title}
  </nav>
  <section className="section-hero">
   <span className="kicker">Районный суд Москвы · раздел {topic.order} из 8</span>
   <h1>{topic.title} — {court.name}</h1>
   <p className="lead">{topic.description}</p>
   <p className="court-source">Независимый справочник, составленный по опубликованным судебным источникам. Персональные назначения, адреса и даты заседаний необходимо проверять на официальном портале перед обращением.</p>
   <div className="court-filter-actions">
    <Link href={hub} className="button button-outline">Все сведения о суде →</Link>
    <a href="#district-topic-content" className="text-link">Практическая инструкция ↓</a>
   </div>
  </section>
  <section className="court-section" id="district-topic-content">
   {topic.slug==='jurisdiction'?<>
    <h2>Как определить суд для конкретного адреса</h2>
    <p>Территориальная подсудность зависит от полного московского адреса и соответствующего процессуального закона. Не выбирайте суд по одной станции метро или названию района.</p>
    <ol><li>Укажите название улицы, номер дома, корпус и строение при наличии.</li>
     <li>В официальном сервисе выберите улицу из подсказок и введите дом.</li>
     <li>Сравните полученный суд с «{court.name}» и отдельно проверьте родовую, альтернативную или исключительную подсудность.</li></ol>
    <MoscowDistrictAddressLookup courtName={court.name}/>
    <p><a className="text-link" href={official.territory} target="_blank" rel="noopener noreferrer">Официальная подсудность {court.name} ↗</a></p>
   </>:null}
   {topic.slug==='competence'?<>
    <h2>Сначала определите вид дела и судебную инстанцию</h2>
    <p>Районные суды рассматривают предусмотренные законом гражданские, административные, уголовные дела, дела по КоАП РФ и отдельные жалобы. Не каждое обращение по московскому адресу подаётся в районный суд.</p>
    <ol>
     <li>Гражданское дело: проверьте, не относится ли заявление к мировому судье либо исключительной подсудности.</li>
     <li>Спор с государственным органом: разграничьте производство по КАС РФ, ГПК РФ и иным законам.</li>
     <li>Спор между предпринимателями или организациями: проверьте компетенцию арбитражного суда.</li>
     <li>Если обжалуется судебный акт, сначала определите суд, вынесший его, и стадию пересмотра.</li>
    </ol>
    <p><Link href="/courts/moscow/registry/moscow-city-court/info/competence" className="text-link">Чем компетенция Московского городского суда отличается от районного →</Link></p>
   </>:null}
   {topic.slug==='filing'?<>
    <h2>Подготовка документов для подачи</h2>
    <ol>
     <li>Определите вид судопроизводства, требования и подсудность.</li>
     <li>Подготовьте заявление и обязательные приложения по применимому кодексу.</li>
     <li>Проверьте госпошлину или основание освобождения и требование направить копии другим участникам.</li>
     <li>Передайте документы разрешённым процессуальным способом и сохраните подтверждение.</li>
    </ol>
    <p>Электронная почта {court.email} — не универсальный канал подачи исков и жалоб. Электронное обращение по 59-ФЗ также не подменяет процессуальную подачу.</p>
    <p><a className="text-link" href={official.overview} target="_blank" rel="noopener noreferrer">Официальная страница суда: способы обращения ↗</a></p>
    <p><a className="text-link" href="https://mos-gorsud.ru/lk" target="_blank" rel="noopener noreferrer">Личный кабинет официального портала ↗</a></p>
   </>:null}
   {topic.slug==='cases'?<>
    <h2>Как найти дело и судебное заседание</h2>
    <ol><li>Выберите суд «{court.name}» и подходящий вид производства.</li>
     <li>Введите номер дела и год. При отсутствии номера используйте фильтры портала.</li>
     <li>Проверьте стадию, дату и зал заседания в официальной карточке; учитывайте судебные извещения.</li></ol>
    {docket?<div className="court-practical-grid">{docket.cases.map(item=><article key={item.number}>
     <h3>Дело № {item.number}</h3><p>{item.category}. {item.sourceStatus}.</p>
     <p className="court-source">Пример записи, не подтверждённое решение по существу. Без данных участников.</p>
    </article>)}</div>:<p>Реальные номера дел без подтверждённого источника пока не копируются на эту страницу.</p>}
    {outcome?<p>По делу № {outcome.number} официальный реестр указывает результат «{outcome.publishedOutcome}». Текст и мотивировка решения не проверялись. <a href={outcome.sourceUrl} target="_blank" rel="noopener noreferrer">Карточка дела ↗</a></p>:null}
    <p><a className="text-link" href={official.cases} target="_blank" rel="noopener noreferrer">Поиск дел {court.name} на официальном портале ↗</a></p>
   </>:null}
   {topic.slug==='appeal'?<>
    <h2>Проверка правильного порядка обжалования</h2>
    <p>Для гражданских решений районного суда Москвы апелляционный маршрут обычно ведёт в Московский городской суд, но жалоба подаётся через суд, вынесший решение. Для иных видов судопроизводства и разных актов правила и сроки различаются.</p>
    <ol><li>Запишите вид производства, суд и дату соответствующего судебного акта.</li>
     <li>Проверьте применимый срок, возможность восстановления и порядок подачи по процессуальному кодексу.</li>
     <li>Подготовьте жалобу и необходимые приложения, направьте её в надлежащий суд.</li></ol>
    <p><Link href="/courts/moscow/registry/moscow-city-court/info/appeals" className="text-link">Маршрут апелляции: Московский городской суд →</Link></p>
   </>:null}
   {topic.slug==='fees'?<>
    <h2>Как проверить госпошлину без ошибки</h2>
    <p>Размер зависит от типа заявления или жалобы, заявителя, цены иска при необходимости и льгот. Ставки и реквизиты могут меняться; не используйте универсальную квитанцию для всех видов обращения.</p>
    <ol><li>Определите характер требования и применимую норму НК РФ.</li>
     <li>Проверьте возможное освобождение, отсрочку или рассрочку уплаты.</li>
     <li>На официальном сайте выберите платёжные реквизиты именно этого суда и сформируйте квитанцию.</li>
     <li>Сохраните подтверждение платежа и приложите его, если требуется законом.</li></ol>
    <p><a href={official.overview} target="_blank" rel="noopener noreferrer" className="text-link">Официальная страница {court.name} для проверки реквизитов ↗</a></p>
   </>:null}
   {topic.slug==='judges'?<>
    <h2>Судьи и сведения об их назначении</h2>
    {roster?<><p>В локальную подборку внесены {roster.judges.length} ФИО из официального списка, обновлённого {roster.sourceLastUpdated}. Это не доказательство его полноты или действующих полномочий каждого судьи.</p>
     <ul>{roster.judges.map(name=><li key={name}>{name}</li>)}</ul>
     <p><a href={roster.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">Официальный список судей ↗</a></p>
    </>:brief?<><p>Подтверждены отдельные публикации, а не полный список действующих судей: {brief.note}</p>
     <ul>{brief.people.map(p=><li key={p.name}>{p.name} — {p.basis}. <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Источник ↗</a></li>)}</ul>
    </>:<p>Для суда пока нет подтверждённой локальной подборки. Проверяйте состав на официальном сайте.</p>}
    <p>Биографию и юридический статус конкретного судьи необходимо сверять по официальному источнику и указам о назначении; отсутствие данных не означает отсутствие судьи в составе.</p>
   </>:null}
   {topic.slug==='faq'?<>
    <h2>Куда обращаться и что проверить перед посещением</h2>
    <dl className="court-facts">
     <div><dt>Адрес из официального справочника</dt><dd>{court.address}</dd></div>
     <div><dt>Часы работы суда</dt><dd>{court.office_hours}</dd></div>
     <div><dt>Электронная почта</dt><dd>{court.email}</dd></div>
     {profile.expeditionPhone?<div><dt>Экспедиция (по опубликованной карточке)</dt><dd>{profile.expeditionPhone}</dd></div>:null}
    </dl>
    {court.visitor_locations?.length?<div className="notice"><strong>Временное расположение подразделений</strong>
      <ul>{court.visitor_locations.map(p=><li key={p.label}>{p.label}: {p.address}</li>)}</ul>
      <p>Место заседания обязательно сверяйте с извещением.</p></div>:null}
    <p>Общий график не равен расписанию архива, экспедиции, приёмной и судебных заседаний. Если планируется личное обращение, предварительно уточните время и адрес конкретного подразделения.</p>
    <p><a href={official.overview} target="_blank" rel="noopener noreferrer" className="text-link">Проверить актуальные контакты и часы приёма ↗</a></p>
   </>:null}
  </section>
  {firstThree&&next&&next.order<=3?<section className="court-section" id="district-route-next">
   <span className="eyebrow">Рекомендуемый маршрут · следующий шаг</span>
   <h2>{next.title}</h2>
   <p>{next.description}</p>
   <Link className="button button-red" href={moscowDistrictTopicHref(slug,next.slug)}>Перейти к следующему разделу →</Link>
  </section>:null}
  <section className="court-section">
   <span className="eyebrow">Все темы по этому суду</span><h2>Что изучить дальше</h2>
   <div className="court-practical-grid">{MOSCOW_DISTRICT_TOPICS.filter(t=>t.slug!==topic.slug).map(t=><article key={t.slug}>
    <h3>{t.title}</h3><p>{t.description}</p>
    <Link className="text-link" href={moscowDistrictTopicHref(slug,t.slug)}>Открыть раздел →</Link>
   </article>)}</div>
   <p><Link href={hub} className="text-link">Вернуться к основной карточке →</Link></p>
  </section>
  <section className="court-section">
   <span className="eyebrow">Первоисточник</span><h2>Официальная информация суда</h2>
   <p>Проверяйте сведения непосредственно на портале перед подачей документов. Первичный источник доступен напрямую без обязательного прохождения внутренних страниц.</p>
   <a href={official.overview} rel="noopener noreferrer" target="_blank">{official.overview} ↗</a>
  </section>
 </article>;
}
