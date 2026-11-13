import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getMoscowOfficialMinimumCourt,MOSCOW_OFFICIAL_MINIMUM_COURTS,MoscowOfficialCourtHref} from '../../../../../../lib/moscow-official-minimum';
import {moscowDistrictIndividual,moscowDistrictOfficialPagesBySlug} from '../../../../../../lib/moscow-district-individual';
import {moscowCourtPracticalFacts} from '../../../../../../lib/moscow-district-practical-facts';
import {moscowPublishedLeadership} from '../../../../../../lib/moscow-district-published-leadership';
import {moscowCourts} from '../../../../../../lib/moscow-courts';
import {MOSCOW_DISTRICT_TOPICS,moscowDistrictTopic,moscowDistrictTopicNext,moscowDistrictTopicHref} from '../../../../../../lib/moscow-district-topics';
import {moscowJudgeRoster,moscowCourtCaseExamples,moscowVerifiedOutcome} from '../../../../../../lib/moscow-district-source-evidence';
import {moscowJudicialSourceBrief} from '../../../../../../lib/moscow-judicial-source-briefs';
import {MoscowDistrictAddressLookup} from '../../../../../../_components/moscow-district-address-lookup';
import {MoscowFilingWizard} from '../../../../../../_components/moscow-filing-wizard';
import {MoscowCourtPublishedJudges,MoscowCourtPublishedCases} from '../../../../../../_components/moscow-court-published-evidence';

type Params={params:Promise<{slug:string;topic:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
 return MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>c.kind==='general-district').flatMap(c=>
  MOSCOW_DISTRICT_TOPICS.map(t=>({slug:c.slug,topic:t.slug})));
}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {slug,topic:topicSlug}=await params;
 const court=getMoscowOfficialMinimumCourt(slug);
 const topic=moscowDistrictTopic(topicSlug);
 if(!court||court.kind!=='general-district'||!topic||!moscowDistrictOfficialPagesBySlug(slug))
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
 const official=moscowDistrictOfficialPagesBySlug(slug);
 if(!court||!topic||!official||court.kind!=='general-district')notFound();
 const url=moscowDistrictTopicHref(slug,topic.slug);
 const next=moscowDistrictTopicNext(topic.slug);
 const practical=moscowCourtPracticalFacts(slug);
 const leader=moscowPublishedLeadership(slug);
 const researchedCourt=moscowCourts().find(c=>c.official_url===official.overview);
 const roster=moscowJudgeRoster(slug);
 const brief=moscowJudicialSourceBrief(slug);
 const docket=moscowCourtCaseExamples(slug);
 const outcome=moscowVerifiedOutcome(slug);
 const hub=MoscowOfficialCourtHref(court);
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
    <h2>Пошаговый подбор порядка подачи документов</h2>
    <MoscowFilingWizard courtName={court.name} officialUrl={official.overview} caseSearchUrl={official.cases}/>
   </>:null}
   {topic.slug==='cases'?<>
    <h2>Как найти дело и судебное заседание</h2>
    <ol><li>Выберите суд «{court.name}» и подходящий вид производства.</li>
     <li>Введите номер дела и год. При отсутствии номера используйте фильтры портала.</li>
     <li>Проверьте стадию, дату и зал заседания в официальной карточке; учитывайте судебные извещения.</li></ol>
    {docket?<div className="court-practical-grid">{docket.cases.map(item=><article key={item.number}>
     <h3>Дело № {item.number}</h3><p>{item.category}. {item.sourceStatus}.</p>
     <p className="court-source">Пример опубликованной записи, не подтверждённое решение по существу. Без сведений об участниках.</p>
    </article>)}</div>:researchedCourt?.case_examples.length?<div>
     <p>В нашей подборке имеются записи из опубликованной судебной выдачи именно этого суда. Их текущее движение и окончательные результаты отдельно не подтверждены.</p>
     <div className="court-practical-grid">{researchedCourt.case_examples.slice(0,8).map(item=><article key={item.number}>
      <h3>Дело № {item.number}</h3>
      <p>{item.case_type}: {item.subject}.</p>
      <p className="court-source">Изучено {item.source_observed_on}. Стадия и текст решения не подтверждены.</p>
      <details><summary>Источник и поиск дела</summary>
       <a href={item.source_url} target="_blank" rel="noopener noreferrer">Официальный раздел делопроизводства ↗</a>
      </details>
     </article>)}</div>
    </div>:<p>Реальные номера дел без подтверждённого источника пока не копируются на эту страницу.</p>}
    {researchedCourt?<p><Link href={hub+'#msk-cases'} className="text-link">Изучить дела и категории на основной странице суда →</Link></p>:null}
    {outcome?<p>По делу № {outcome.number} официальный реестр указывает результат «{outcome.publishedOutcome}». Текст и мотивировка решения не проверялись. <a href={outcome.sourceUrl} target="_blank" rel="noopener noreferrer">Карточка дела ↗</a></p>:null}
    <p><a className="text-link" href={official.cases} target="_blank" rel="noopener noreferrer">Поиск дел {court.name} на официальном портале ↗</a></p>
   </>:null}
   {topic.slug==='cases'?<MoscowCourtPublishedCases courtSlug={slug}/>:null}
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
    {leader?<div className="notice"><strong>Руководство — по официальной странице суда</strong>
     <p>{leader.name}. {leader.positionAsPublished==='acting'?'Исполняющий обязанности председателя (как указано в источнике).':leader.positionAsPublished==='status_disputed'?'В официальных версиях расходится указание должности руководителя.':'Опубликован как председатель суда.'} Действующие полномочия дополнительно не подтверждены.</p>
     {leader.notice?<p>{leader.notice}</p>:null}
     <details><summary>Официальная страница руководства</summary><a href={leader.sourceUrl} target="_blank" rel="noopener noreferrer">Проверить запись ↗</a></details>
    </div>:profile?.chairPublished?<div className="notice">
     <strong>Руководство — по опубликованной справке</strong>
     <p>{profile.chairPublished.replace(/^И\. о\. /,'')}. {profile.chairStatus==='conflicting_sources'?'Текущий статус нельзя установить из расходящихся публикаций.':profile.chairStatus==='acting_as_published'?'Исполняющий обязанности по публикации.':'Опубликован как председатель суда.'} Актуальность назначения требует проверки.</p>
    </div>:null}
    {roster?<p>Для этого суда имеется отдельная подборка из {roster.judges.length} ФИО, опубликованная в официальном списке. Дата обновления списка: {roster.sourceLastUpdated??'не указана'}. Это не подтверждает действующий состав на сегодняшний день.</p>:
     brief?<p>Для этого суда пока доступны отдельные официальные кадровые публикации, а не полный подтверждённый состав: {brief.note}</p>:
     <p>Для этого суда полный актуальный список судей пока не подтверждён отдельным официальным реестром. Опубликованные сведения о председателе и назначениях отображаются ниже в пределах подтверждённых источников.</p>}
    <MoscowCourtPublishedJudges courtSlug={slug}/>
    <p>Факт включения в исторический список, сообщение о назначении и работа в составе суда сегодня — разные обстоятельства. Биографии, полномочия и распределение дел нужно сверять по соответствующим первоисточникам.</p>
   </>:null}
   {topic.slug==='faq'?<>
    <h2>Куда обращаться и что проверить перед посещением</h2>
    <dl className="court-facts">
     <div><dt>Адрес из официального справочника</dt><dd>{court.address}</dd></div>
     <div><dt>Часы работы суда</dt><dd>{court.office_hours}</dd></div>
     <div><dt>Электронная почта</dt><dd>{court.email}</dd></div>
     {profile?.expeditionPhone?<div><dt>Экспедиция (по опубликованной карточке)</dt><dd>{profile.expeditionPhone}</dd></div>:null}
     {practical?.serviceHours.map(unit=><div key={unit.label}><dt>{unit.label}</dt><dd>{unit.schedule}{unit.phone?' · '+unit.phone:''}</dd></div>)}
     {practical?.travel?<div><dt>Как добраться</dt><dd>{practical.travel}</dd></div>:null}
     {practical?.accessiblePhone?<div><dt>Помощь посетителям с ограниченной мобильностью</dt><dd>{practical.accessiblePhone}</dd></div>:null}
    </dl>
    {court.visitor_locations?.length?<div className="notice"><strong>Временное расположение подразделений</strong>
      <ul>{court.visitor_locations.map(p=><li key={p.label}>{p.label}: {p.address}</li>)}</ul>
      <p>Место заседания обязательно сверяйте с извещением.</p></div>:null}
    {practical?.notes.map(note=><p key={note} className="court-source">{note}</p>)}
    <p>Общий график не равен расписанию архива, экспедиции, приёмной и судебных заседаний. Если планируется личное обращение, предварительно уточните время и адрес конкретного подразделения.</p>
    <div className="moscow-faq" id="district-practical-faq">
     <details><summary>Какие документы взять с собой в суд?</summary><p>Возьмите документ, удостоверяющий личность, извещение или номер дела и при необходимости документы о полномочиях представителя. Если передаёте заявление лично, подготовьте приложения и свой экземпляр для отметки о приёме.</p></details>
     <details><summary>Можно ли отправить иск по электронной почте?</summary><p>Обычный адрес электронной почты суда предназначен для справочной корреспонденции и не заменяет установленный порядок процессуальной подачи. Узнайте подходящий способ в разделе <Link href={moscowDistrictTopicHref(slug,'filing')}>«Как подать документы»</Link>.</p></details>
     <details><summary>Как выбрать между мировым судьёй и районным судом?</summary><p>Выбор зависит от вида требований и специальных правил компетенции. Место проживания само по себе не отвечает на этот вопрос. Начните с раздела <Link href={moscowDistrictTopicHref(slug,'competence')}>«Какие дела рассматривает суд»</Link>.</p></details>
     <details><summary>Суд находится рядом с домом — значит, иск надо подавать сюда?</summary><p>Нет. Нужен точный адрес с домом и корпусом, а иногда действуют специальные, альтернативные или исключительные правила. Используйте раздел <Link href={moscowDistrictTopicHref(slug,'jurisdiction')}>«Подсудность по адресу»</Link>.</p></details>
     <details><summary>Как узнать, принято ли моё заявление?</summary><p>Сохраните документ о передаче или почтовое подтверждение. Затем проверяйте сведения в официальном делопроизводстве с учётом времени на обработку поступления. Подробнее — в разделе <Link href={moscowDistrictTopicHref(slug,'cases')}>«Поиск дел и заседаний»</Link>.</p></details>
     <details><summary>Почему не удаётся найти дело по номеру?</summary><p>Проверьте суд, год, тип производства и формат номера. Поступившие документы могут появляться не сразу. Отсутствие записи в нашей подборке не доказывает отсутствие дела.</p></details>
     <details><summary>Где узнать дату, время и зал заседания?</summary><p>Ориентируйтесь на официальную карточку производства и судебное извещение. Если место или время изменилось, уточните сведения у соответствующего подразделения суда. Общий адрес не всегда совпадает с местом конкретного заседания.</p></details>
     <details><summary>Могу ли я ознакомиться с материалами дела?</summary><p>Участники производства и их представители могут обладать соответствующими процессуальными правами. Для согласования ознакомления уточните номер дела, его местонахождение и требования к документам о полномочиях.</p></details>
     <details><summary>Как получить копию решения или иной судебный документ?</summary><p>Выясните, изготовлен ли соответствующий акт и какой отдел обеспечивает выдачу. Порядок предоставления копий различается в зависимости от вида производства, процессуального положения и статуса документа.</p></details>
     <details><summary>Можно ли обжаловать судебный акт?</summary><p>Сначала определите вид судопроизводства и акта: сроки, форма жалобы и компетентный суд различаются. Откройте наш раздел <Link href={moscowDistrictTopicHref(slug,'appeal')}>«Порядок обжалования»</Link> для выбора дальнейших действий.</p></details>
     <details><summary>Обязательно ли платить государственную пошлину?</summary><p>Это зависит от вида обращения, заявителя, характера требований и предусмотренных законом льгот. Реквизиты платежа нельзя переносить между судами без проверки. Подробнее — в разделе <Link href={moscowDistrictTopicHref(slug,'fees')}>«Государственная пошлина»</Link>.</p></details>
     <details><summary>Что делать, если у суда несколько адресов?</summary><p>Разделяйте почтовый адрес, место подачи документов и помещение конкретного судебного заседания. {court.visitor_locations?.length?'Для этого суда опубликованы сведения о временном размещении подразделений.':'При наличии отдельного адреса подразделения уточните место приёма.'} Проверьте его по судебному извещению и официальной справке, прежде чем ехать.</p></details>
    </div>
    <p><a href={official.overview} target="_blank" rel="noopener noreferrer" className="text-link">Проверить актуальные контакты и часы приёма ↗</a></p>
   </>:null}
  </section>
  {next?<section className="court-section" id="district-route-next">
   <span className="eyebrow">Рекомендуемый маршрут · следующий шаг</span>
   <h2>{next.title}</h2>
   <p>{next.description}</p>
   <Link className="button button-red" href={moscowDistrictTopicHref(slug,next.slug)}>Продолжить изучение суда →</Link>
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
