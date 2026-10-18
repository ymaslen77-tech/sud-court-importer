import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {moscowCourt,moscowCourts,officialMoscowUrl,type MoscowCourt} from '../../../lib/moscow-courts';

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
  robots:{index:false,follow:true}
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
 const others=moscowCourts().filter(item=>item.slug!==c.slug).slice(0,4);
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span>
   <Link href="/courts/moscow">Москва</Link><span>/</span>{c.name}</div>
  <section className="section-hero">
   <span className="kicker">Москва · районный суд · исследовательское досье</span>
   <h1>{c.name}</h1>
   <p className="lead">Адрес и контакты, виды рассматриваемых дел, примеры из официальных реестров, территориальная подсудность, порядок подачи и обжалования.</p>
   <div className="notice" role="note">Сведения изучены по официальным публикациям 18.10.2026; редакционная актуальность на сегодня не подтверждена. Вынесенные решения, стадии дел, работа телефонов и границы адресной подсудности требуют отдельной сверки.</div>
   <nav className="court-toc" aria-label="Содержание досье">
    <strong>Перейти к разделу</strong>
    <a href="#msk-contacts">Адрес и телефоны</a><a href="#msk-map">Как добраться</a>
    <a href="#msk-jurisdiction">Подсудность</a><a href="#msk-case-kinds">Виды дел</a>
    <a href="#msk-cases">Конкретные дела</a><a href="#msk-filing">Подача документов</a>
    <a href="#msk-fees">Госпошлина</a><a href="#msk-appeal">Обжалование</a>
    <a href="#msk-faq">FAQ</a><a href="#msk-sources">Источники</a>
   </nav>
  </section>
  <section className="court-section" id="msk-contacts">
   <span className="eyebrow">Как связаться с судом</span><h2>Адрес, приёмная и режим работы</h2>
   <dl className="court-facts">
    <div><dt>Адрес из официальной публикации</dt><dd>{c.address}</dd></div>
    <div><dt>Экспедиция / приём документов</dt><dd>{c.expedition_phone??'Номер требует проверки; не публикуем повреждённую запись'}</dd></div>
    <div><dt>Справочная электронная почта</dt><dd>{c.email}</dd></div>
    <div><dt>Общий режим из публикации</dt><dd>{c.office_hours}</dd></div>
    <div><dt>Приём конкретной канцелярии</dt><dd>Часы архива, выдачи копий и личного приёма уточняются отдельно; общий режим суда не означает приём каждого отдела.</dd></div>
   </dl>
   <p className="court-source"><External href={c.official_url}>Сведения и сообщения на официальном сайте</External>. Электронная почта не является каналом процессуальной подачи.</p>
  </section>
  <section className="court-section" id="msk-map">
   <h2>Где находится суд и как добраться</h2>
   <p>{c.address}. Для ориентирования можно открыть поиск адреса на карте; точная точка входа и приспособления для маломобильных посетителей пока не подтверждены.</p>
   <p><a href={'https://yandex.ru/maps/?text='+encodeURIComponent(c.address)} target="_blank" rel="noopener noreferrer">Найти адрес на Яндекс Картах ↗</a></p>
   <p className="court-source"><strong>Важно:</strong> {c.notes}</p>
  </section>
  <section id="msk-jurisdiction" className="court-section">
   <span className="eyebrow">Территориальная подсудность</span><h2>Какие адреса относятся к суду</h2>
   <p>{c.jurisdiction_scope}</p>
   <p>Нельзя определить подсудность только по названию района Москвы, почтовому индексу, расположению здания суда либо близости к метро. Для конкретного спора могут действовать альтернативные, исключительные и специальные правила.</p>
   <div className="notice" role="note"><strong>Полные улицы и дома:</strong> подтверждённого локального перечня пока нет. Автоматическое определение по нашему сайту заблокировано, чтобы избежать направления документов не в тот суд.</div>
   <p><External href={c.territory_service_url}>Официальный поиск подсудности по адресу и номеру дома</External></p>
   <p><Link className="text-link" href="/jurisdiction">Ограничения нашего собственного адресного поиска →</Link></p>
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
  <section className="court-section" id="msk-cases">
   <span className="eyebrow">Номера из официальной судебной выдачи</span><h2>Примеры конкретных дел этого суда</h2>
   <p>Ниже представлены идентификаторы обнаруженных в официальном реестре дел. Мы не копируем ФИО участников и не утверждаем актуальную стадию, дату заседания или исход. Это <strong>исторические исследовательские примеры</strong>, а не полный и не обновляемый в реальном времени реестр.</p>
   <div className="court-department-grid">
   {c.case_examples.map(item=><article key={item.number}>
    <h3>Дело № {item.number}</h3>
    <p><strong>{item.case_type}</strong></p><p>{item.subject}</p>
    <p className="court-source">Зафиксировано в исследовании 18.10.2026 · результат и актуальный статус не подтверждены.</p>
    <External href={item.source_url}>Открыть официальный список и найти дело по номеру</External>
   </article>)}
   </div>
   <p><External href={c.case_service_url}>Все официальные списки дел и материалов этого суда</External></p>
   <p className="court-source">После разрешённого источникового импорта и правовой проверки сюда можно добавлять номера, категории, стадии, даты и тексты опубликованных судебных актов с историей изменений.</p>
  </section>
  <section className="court-section" id="msk-filing">
   <h2>Как подать иск, заявление или жалобу</h2>
   <ol className="court-practical-steps">{stages.map(([label,desc])=><li key={label}><strong>{label}.</strong> {desc}</li>)}</ol>
   <p><a href="https://ej.sudrf.ru/" target="_blank" rel="noopener noreferrer">Официальный сервис электронной подачи ГАС «Правосудие» ↗</a></p>
   <p>Письмо на общий e-mail суда не заменяет подачу процессуальных документов. Порядок и требования к электронной подписи различаются по видам документов и процессу.</p>
  </section>
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
   <p className="court-source">Нельзя автоматически применять один общий срок апелляции ко всем судебным производствам и актам.</p>
  </section>
  <CourtFaq court={c}/>
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
