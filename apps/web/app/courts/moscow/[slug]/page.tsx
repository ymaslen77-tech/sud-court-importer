import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {moscowCourt,moscowCourts,officialMoscowUrl,type MoscowCourt} from '../../../lib/moscow-courts';
import {MoscowYandexMap} from '../../../_components/moscow-yandex-map';
import {MoscowTerritoryChecker} from '../../../_components/moscow-territory-checker';
import {MoscowCasesExplorer} from '../../../_components/moscow-cases-explorer';
import {adjudicatedCasesFor} from '../../../lib/moscow-adjudicated-cases';
import {MoscowLeadCapture} from '../../../_components/moscow-lead-capture';
import {CourtDossierCompleteness} from '../../../_components/court-dossier-completeness';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS} from '../../../lib/moscow-official-minimum';
import {moscowDistrictSeoRobots} from '../../../lib/moscow-city-seo';

type Props={params:Promise<{slug:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return moscowCourts().map(c=>({slug:c.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const court=moscowCourt((await params).slug);
 if(!court)return {title:'Суд не найден',robots:{index:false,follow:false}};
 return {
  title:court.name+' — адрес, дела, подсудность и обжалование',
  description:court.name+'. '+court.address+'. Контакты суда, судебные дела и категории споров, подсудность по адресу, подача документов и порядок обжалования.',
  alternates:{canonical:'/courts/moscow/'+court.slug},
  robots:moscowDistrictSeoRobots()
 };
}
const records=[
 {name:'Гражданские дела (ГПК РФ)',source:'civil',desc:'Иски по договорам, недвижимости, наследству, семейным и трудовым спорам, защите прав потребителей — если дело подсудно районному суду. Мировые судьи и иные суды рассматривают исключения.',law:'Статьи 23–24 ГПК РФ'},
 {name:'Административные дела (КАС РФ)',source:'kas',desc:'Оспаривание решений и действий публичных органов и должностных лиц и другие публично-правовые споры с учётом специальных правил подсудности.',law:'Статьи 17.1–21 КАС РФ'},
 {name:'Уголовные дела (УПК РФ)',source:'criminal',desc:'Преступления, подсудные районному суду; ходатайства следствия и процессуальные материалы в предусмотренных законом случаях.',law:'Статья 31 УПК РФ'},
 {name:'Административные правонарушения (КоАП РФ)',source:'',desc:'Только те категории административных правонарушений и жалоб, которые закон относит к компетенции районных судей.',law:'Статья 23.1 и глава 30 КоАП РФ'}
];
const faqs=[
 ['Можно ли подать иск на электронную почту суда?','Обычная электронная почта не заменяет установленную процессуальную электронную подачу. Используйте официальный сервис или предусмотренные законом бумажные способы.'],
 ['Как проверить дело по номеру?','Откройте официальный реестр конкретного суда, выберите вид производства и введите номер дела. Наша подборка примеров не является онлайн-реестром.'],
 ['Как узнать, что мой адрес относится к этому суду?','Проверьте адрес, номер дома и при наличии корпус/строение в официальном территориальном поиске. Название района или ближайшее метро не гарантируют подсудность.'],
 ['Куда подавать апелляцию?','Маршрут зависит от вида производства и судебного акта. Во многих случаях жалоба подаётся через суд, вынесший акт, но есть процессуальные исключения.'],
 ['Как узнать зал и время заседания?','Сверьте сведения в официальной карточке дела и судебном извещении. Временные помещения, отмены и переносы нельзя определять только по почтовому адресу.'],
 ['Можно ли считать указанный состав судей действующим?','Нет: без проверки назначения, переводов, прекращения полномочий и обновлений нельзя считать историческую публикацию подтверждением действующего состава.']
];
const stages=[
 ['1. Установите компетенцию','Определите вид процесса и проверьте, вправе ли этот суд рассматривать требование по первой инстанции.'],
 ['2. Проверьте территориальную подсудность','При необходимости учтите адрес ответчика, место нахождения недвижимости, договорную или исключительную подсудность.'],
 ['3. Подготовьте обращение','Составьте иск, заявление, жалобу либо ходатайство с обоснованием, доказательствами и приложениями.'],
 ['4. Проверьте пошлину','Используйте действующие нормы НК РФ, льготы и реквизиты по назначению платежа на официальной странице суда.'],
 ['5. Подайте документы','Выберите допустимый способ: приёмная, почта или официальный электронный сервис. Сохраните подтверждение подачи.'],
 ['6. Следите за движением дела','Проверяйте номер и текущую стадию в официальной системе; учитывайте возможность переноса заседания.']
];
function External({href,children}:{href:string;children:React.ReactNode}){
 const safe=officialMoscowUrl(href);
 return safe?<a href={safe} rel="noopener noreferrer" target="_blank">{children} ↗</a>:null;
}
function CourtFaq({court}:{court:MoscowCourt}){
 return <section id="msk-faq" className="court-section"><h2>Частые вопросы о суде</h2>
 <div className="moscow-faq">{faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
 <p className="court-source">Общие ответы необходимо применять с учётом обстоятельств и действующей редакции закона.</p></section>;
}
export default async function MoscowCourtPage({params}:Props){
 const c=moscowCourt((await params).slug);
 if(!c)notFound();
 const officialMinimum=MOSCOW_OFFICIAL_MINIMUM_COURTS.find(item=>
  c.name.toLocaleLowerCase('ru').replace(/ё/g,'е')
   .startsWith(item.name.toLocaleLowerCase('ru').replace(/ё/g,'е')));
 const moved=Boolean(officialMinimum?.visitor_locations?.length);
 const others=moscowCourts().filter(item=>item.slug!==c.slug).slice(0,4);
 const intakeReady=process.env.COURT_LEADS_ENABLED==='true' &&
  process.env.COURT_LEADS_RU_STORAGE_ATTESTED==='true' &&
  Boolean(process.env.COURT_LEADS_OPERATOR_NAME?.trim()) &&
  Boolean(process.env.COURT_LEADS_PRIVACY_URL?.startsWith('https://')) &&
  Boolean(process.env.COURT_LEADS_WEBHOOK_URL?.startsWith('https://')) &&
  Boolean(process.env.COURT_LEADS_WEBHOOK_TOKEN && process.env.COURT_LEADS_WEBHOOK_TOKEN.length>=32);
 const privacyUrl=intakeReady?process.env.COURT_LEADS_PRIVACY_URL!:null;
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>{c.name}</div>
  <section className="section-hero">
   <span className="kicker">Москва · районный суд · исследовательское досье</span>
   <h1>{c.name}</h1>
   <p className="lead">Адрес и контакты, виды рассматриваемых дел, примеры из официальных реестров, территориальная подсудность, порядок подачи и обжалования.</p>
   <div className="notice" role="note">Сведения изучены по официальным публикациям 18.10.2026; редакционная актуальность на сегодня не подтверждена. Вынесенные решения, стадии дел, работа телефонов и границы адресной подсудности требуют отдельной сверки.</div>
   <CourtDossierCompleteness withSources={['identity','contacts','sources','filing','cases']}/>
   <nav className="court-toc" aria-label="Содержание досье">
    <strong>Перейти к разделу</strong>
    <a href="#msk-contacts">Адрес и телефоны</a><a href="#msk-map">Как добраться</a>
    <a href="#msk-jurisdiction">Подсудность</a><a href="#msk-case-kinds">Виды дел</a>
    <a href="#msk-cases">Конкретные дела</a><a href="#msk-filing">Подача документов</a>
    <a href="#msk-fees">Госпошлина</a><a href="#msk-appeal">Обжалование</a>
    <a href="#msk-hearings">Заседания и движение дел</a>
    <a href="#msk-archives">Копии решений и архив</a>
    <a href="#msk-judges">Судьи и аппарат</a><a href="#msk-access">Правила посещения</a>
    <a href="#msk-faq">FAQ</a><a href="#msk-lead-question">Задать вопрос</a>
    <a href="#msk-lead-callback">Обратный звонок</a><a href="#msk-sources">Источники</a>
   </nav>
  </section>
  <section className="court-section" id="msk-contacts">
   <span className="eyebrow">Как связаться с судом</span><h2>Адрес, приёмная и режим работы</h2>
   {moved?<div className="notice moscow-relocation-note" role="note">
    <strong>Внимание: временные помещения суда</strong>
    <p>{officialMinimum?.location_notice}</p>
    <ul>{officialMinimum?.visitor_locations?.map(location=><li key={location.label}>
     <strong>{location.label}:</strong> {location.address}
    </li>)}</ul>
    {officialMinimum?.location_notice_url?<a href={officialMinimum.location_notice_url} target="_blank" rel="noopener noreferrer">
      Проверить адрес по официальному сообщению ↗
    </a>:null}
   </div>:null}
   <dl className="court-facts">
    <div><dt>{moved?'Почтовый адрес суда':'Адрес из официальной публикации'}</dt><dd>{c.address}</dd></div>
    <div><dt>Экспедиция / приём документов</dt><dd>{c.expedition_phone??'Номер требует проверки; не публикуем повреждённую запись'}</dd></div>
    <div><dt>Справочная электронная почта</dt><dd>{c.email}</dd></div>
    <div><dt>Общий режим из публикации</dt><dd>{c.office_hours}</dd></div>
    <div><dt>Приём конкретной канцелярии</dt><dd>Часы архива, выдачи копий и личного приёма уточняются отдельно; общий режим суда не означает приём каждого отдела.</dd></div>
   </dl>
   <p className="court-source"><External href={c.official_url}>Сведения и сообщения на официальном сайте</External>. Электронная почта не является каналом процессуальной подачи.</p>
  </section>
  <MoscowYandexMap court={moved&&officialMinimum?.visitor_locations?.[0]
    ?{...c,address:officialMinimum.visitor_locations[0].address,
      notes:'Карта показывает лишь первый из временных адресов. Конкретное место заседания и отдел необходимо сверить в официальном сообщении и извещении.'}
    :c}/>
  <section id="msk-jurisdiction" className="court-section">
   <span className="eyebrow">Территориальная подсудность</span><h2>Какие адреса относятся к суду</h2>
   <p>Проверяйте именно адрес здания с номером дома, корпусом и строением. Название района или ближайшее метро не гарантируют принадлежность суду.</p>
   <MoscowTerritoryChecker court={c}/>
   <details className="moscow-case-topic"><summary>Как правильно определить подсудность</summary><div className="moscow-case-topic-content">
    <ol>
     <li>Введите улицу и номер дома; при наличии укажите корпус и строение.</li>
     <li>Результат с зелёной или красной отметкой появляется только по проверенной адресной записи с первоисточником.</li>
     <li>Если база пока не знает адрес, откройте официальный сервис и не делайте вывод о суде по географии на глаз.</li>
     <li>Учитывайте родовую, альтернативную и исключительную подсудность по вашему спору.</li>
    </ol>
   </div></details>
   <p className="court-source"><External href={c.territory_service_url}>Проверить в официальном поиске подсудности по адресу</External> · <Link href="/jurisdiction" className="text-link">Другие виды подсудности →</Link></p>
  </section>
  <section className="court-section" id="msk-case-kinds">
   <span className="eyebrow">Компетенция суда</span><h2>Какие дела рассматривает суд</h2>
   <p>Районный суд рассматривает дела в пределах своей родовой, территориальной и инстанционной подсудности; наличие категории в перечне не означает принятие любого такого спора без исключений.</p>
   <div className="court-practical-grid">
   {records.map(kind=><article key={kind.name}><h3>{kind.name}</h3><p>{kind.desc}</p>
    <p className="court-source">{kind.law}</p>
    <External href={c.case_service_url}>Официальный перечень производств</External>
   </article>)}
   </div>
  </section>
  <MoscowCasesExplorer court={c} decisions={adjudicatedCasesFor(c.slug)}/>
  <section className="court-section" id="msk-hearings">
   <span className="eyebrow">Поиск информации о процессе</span>
   <h2>Заседания, стадия дела, номер зала и движение производства</h2>
   <p>По номеру дела на персональном портале суда можно проверить опубликованную информацию о регистрации, назначении и переносе заседаний, судье и зале. Не все процессуальные действия отображаются сразу: судебное извещение имеет самостоятельное юридическое значение.</p>
   <ol className="court-practical-steps">
    <li>Определите процессуальный вид дела: гражданское, административное, уголовное или КоАП.</li>
    <li>Найдите номер в тематической подборке выше либо в реестре судебных производств.</li>
    <li>Проверьте сведения о дате, времени, помещении и опубликованных судебных актах в индивидуальной карточке дела.</li>
    <li>При противоречии сведений уточните их у канцелярии суда и учитывайте официальное судебное извещение.</li>
   </ol>
   <p className="court-source">На нашей странице показываются документированные примеры дел, но не текущий календарь всех заседаний. <External href={c.case_service_url}>Официальный поиск актуального движения производств</External></p>
  </section>
  <section className="court-section" id="msk-filing">
   <h2>Как подать иск, заявление или жалобу</h2>
   <ol className="court-practical-steps">{stages.map(([label,desc])=><li key={label}><strong>{label}.</strong> {desc}</li>)}</ol>
   <p><a href="https://ej.sudrf.ru/" target="_blank" rel="noopener noreferrer">Официальный сервис электронной подачи ГАС «Правосудие» ↗</a></p>
   <p>Письмо на общий e-mail суда не заменяет подачу процессуальных документов. Порядок и требования к электронной подписи различаются по видам документов и процессу.</p>
  </section>
  <section className="court-section" id="msk-archives">
   <h2>Как получить копию судебного акта и ознакомиться с делом</h2>
   <div className="court-practical-grid">
    <article><h3>Ознакомление с материалами</h3><p>Для ознакомления обычно требуется подтвердить процессуальное положение и полномочия представителя. Уточните в канцелярии, нужна ли запись, где хранится том дела и когда возможен доступ.</p></article>
    <article><h3>Получение копии решения</h3><p>Назовите номер дела и сведения о процессуальном положении. Способ выдачи, сроки и возможность электронной копии зависят от вида производства и действующего процессуального закона.</p></article>
    <article><h3>Исполнительный документ</h3><p>Не смешивайте изготовление исполнительного листа с его предъявлением к исполнению. Проверьте вступление судебного акта в силу и применимые исключения.</p></article>
    <article><h3>Архив суда</h3><p>Для архивного производства уточните год и номер дела, порядок заказа материалов, часы приёма архива и требования к удостоверению личности.</p></article>
   </div>
   <p className="court-source">Время выдачи документов и архивный режим данного суда пока не подтверждены самостоятельными официальными публикациями.</p>
  </section>
  <MoscowLeadCapture courtName={c.name} slug={c.slug} enabled={intakeReady} privacyUrl={privacyUrl} variant="question"/>
  <section className="court-section" id="msk-fees">
   <h2>Госпошлина и платёжные реквизиты</h2>
   <p>Размер госпошлины зависит от вида обращения, стоимости требований, статуса плательщика, льгот и действующей редакции статей 333.19–333.20 НК РФ. Здесь не публикуется неподтверждённая банковская квитанция.</p>
   <p><External href={c.official_url+'/services'}>Проверить действующие реквизиты на официальном портале</External></p>
   <p className="court-source">Реквизиты депозитного счёта, залога и процессуальных издержек не следует использовать для оплаты государственной пошлины.</p>
  </section>
  <section className="court-section" id="msk-appeal">
   <h2>Как обжаловать решение суда</h2>
   <p>Судебное решение по гражданскому делу в обычном порядке обжалуется в апелляционную инстанцию по правилам главы 39 ГПК РФ. Для административного, уголовного производства и дел по КоАП применяются собственные сроки, способы подачи и круг заявителей.</p>
   <p>Для актов районного суда города Москвы типичной апелляционной инстанцией выступает Московский городской суд; но путь проверки конкретного постановления нужно определять по виду акта и применимой процедуре.</p>
   <p><External href={c.official_url+'/services'}>Официальные разъяснения порядка обжалования</External></p>
   <div className="court-practical-grid">
    <article><h3>Гражданское судопроизводство</h3><p>Проверьте вид судебного акта и порядок подачи через суд первой инстанции; сроки регулирует ГПК РФ, включая возможные исключения и восстановление пропущенного срока.</p></article>
    <article><h3>Административное судопроизводство</h3><p>Производства по КАС РФ требуют отдельной проверки срока и инстанции, особенно по специальным категориям административных дел.</p></article>
    <article><h3>Уголовные дела</h3><p>Для приговоров и постановлений применяется порядок УПК РФ; сроки и процессуальное положение заявителя существенно различаются.</p></article>
    <article><h3>Дела об административных правонарушениях</h3><p>Правила главы 30 КоАП РФ отличаются от апелляции по ГПК: в предусмотренных законом случаях жалоба подаётся непосредственно уполномоченному суду или органу.</p></article>
   </div>
   <p className="court-source">Нельзя автоматически применять один общий срок апелляции ко всем судебным производствам и актам.</p>
  </section>
  <section className="court-section" id="msk-judges">
   <h2>Судьи, руководство и структурные подразделения</h2>
   <p>Председатель суда, заместители, судьи, аппарат, экспедиция, гражданская и уголовная канцелярии выполняют разные функции. Опубликованные ФИО не признаём подтверждением текущих полномочий без проверки назначения, перевода и актуальной редакции.</p>
   <p>Для запросов о судебном деле используйте специализированную канцелярию и номер производства. Пресс-служба и личный приём руководства не заменяют процессуальные жалобы.</p>
   <p className="court-source">Персональный действующий состав и прямые телефоны всех отделов этого суда ещё проходят отдельную проверку; непроверенные имена не публикуются как актуальные.</p>
  </section>
  <section className="court-section" id="msk-access">
   <h2>Правила посещения и доступность здания</h2>
   <p>Перед посещением возьмите удостоверение личности, судебное извещение либо номер дела и при необходимости документы о полномочиях. Для прохода может действовать пропускной режим и досмотр.</p>
   <p>При необходимости безбарьерного доступа уточните у приёмной, есть ли доступный вход, лифт, сопровождение и возможность подачи заявления об оказании помощи. Не делаем вывод о наличии пандуса по одной лишь общей инструкции о посещении.</p>
   <p className="court-source">Подтверждённая схема доступного входа и условия сопровождения для конкретного здания пока отсутствуют.</p>
  </section>
  <CourtFaq court={c}/>
  <MoscowLeadCapture courtName={c.name} slug={c.slug} enabled={intakeReady} privacyUrl={privacyUrl} variant="callback"/>
  <section className="court-section" id="msk-sources">
   <h2>Источники, дата исследования и дальнейшая проверка</h2>
   <ul>
    <li><External href={c.official_url}>Персональная страница суда, адрес и контакты</External></li>
    <li><External href={c.case_service_url}>Официальный реестр судебных дел</External></li>
    <li><External href={c.territory_service_url}>Официальный сервис территориальной подсудности</External></li>
   </ul>
   <p>Исследование: {c.source_observed_on}. Текущие полномочия судей, индивидуальные часы приёма, банковские реквизиты, условия доступности и полный адресный реестр ещё не прошли самостоятельную редакционную приёмку.</p>
   <p className="court-source">Страница — независимый справочный материал. До завершения приёмки закрыта от индексирования; это не официальный сайт суда.</p>
  </section>
  <section className="section-wrap"><h2>Другие суды Москвы</h2>
   <div className="results">{others.map(item=><Link className="result-row" key={item.slug} href={'/courts/moscow/'+item.slug}>
    <span><strong>{item.name}</strong><small>{item.address}</small></span><span aria-hidden="true">↗</span>
   </Link>)}</div>
   <p><Link className="text-link" href="/courts/moscow">Все 12 московских карточек →</Link></p>
  </section>
 </>;
}
