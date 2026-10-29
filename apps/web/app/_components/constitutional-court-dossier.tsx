import Link from 'next/link';
import {CONSTITUTIONAL_REFERENCE_BASE,CONSTITUTIONAL_REFERENCE_TOPICS} from '../lib/constitutional-reference-library';
import {YandexCourtMap} from './yandex-court-map';
import {ConstitutionalComplaintSelfCheck} from './constitutional-complaint-selfcheck';
import {
 CONSTITUTIONAL_JUDGES,CONSTITUTIONAL_PRACTICE,
 CONSTITUTIONAL_SECRETARIAT,CONSTITUTIONAL_CONTACTS
} from '../lib/constitutional-court-data';

const stamp='Сведения по первоисточникам, собранные 27 октября 2026 года';
const sections=[
 ['overview','О суде'],['judges','Судьи'],['contacts','Адрес и приём'],
 ['competence','Компетенция'],['complaint','Как обратиться'],['practice','Практика'],
 ['office','Аппарат'],['history','История'],['questions','Вопросы']
] as const;
const topics=[
 ['Конституционный контроль','Проверяет нормативные акты на соответствие Конституции РФ в пределах статьи 125 Конституции РФ и ФКЗ № 1-ФКЗ.'],
 ['Жалобы граждан и организаций','Проверяет конституционность нормативного акта, применённого в конкретном деле, после исчерпания установленных средств судебной защиты.'],
 ['Запросы судов','Рассматривает запросы судов о конституционности нормативных актов, подлежащих применению в конкретном деле.'],
 ['Споры о компетенции','Разрешает предусмотренные законом споры между государственными органами.'],
 ['Толкование Конституции','Осуществляет официальное толкование Конституции РФ по запросам уполномоченных органов.'],
 ['Иные специальные полномочия','Даёт предусмотренные Конституцией заключения и решает другие вопросы в границах полномочий, установленных законом.']
] as const;
const steps=[
 {number:'01',name:'Определите оспариваемую норму',desc:'Обращение должно касаться конституционности закона или другого указанного в статье 125 нормативного акта, применённого к вашему делу. КС РФ не пересматривает факты как очередная апелляция.'},
 {number:'02',name:'Проверьте допустимость',desc:'В обычной индивидуальной жалобе нужны признаки нарушения конституционного права, применение нормы в конкретном деле и исчерпание внутригосударственных средств судебной защиты.'},
 {number:'03',name:'Проверьте срок',desc:'Общий срок — один год после решения, которым исчерпаны доступные внутригосударственные средства судебной защиты; специальные ситуации требуют отдельной оценки.'},
 {number:'04',name:'Подготовьте жалобу и приложения',desc:'Укажите заявителя, оспариваемую норму и нарушенные права, аргументацию, требование, перечень документов; приложите судебные акты и документ об уплате пошлины либо мотивированное ходатайство.'},
 {number:'05',name:'Подайте обращение',desc:'Можно отправить по почте, передать в приёмную либо подать через официальный личный кабинет; электронное письмо с процессуальной жалобой требует усиленной квалифицированной электронной подписи.'}
] as const;
const questions=[
 {q:'Можно ли подать просто жалобу на решение районного суда?',a:'Нет. Конституционный Суд не подменяет кассационную или надзорную инстанцию и не перепроверяет фактические обстоятельства. Предмет — конституционность применённой нормативной нормы.'},
 {q:'Каков срок обращения по индивидуальной жалобе?',a:'Как правило, один год после судебного решения, которым исчерпаны внутригосударственные средства судебной защиты. Основания и начало срока зависят от процессуальной ситуации — статья 97 ФКЗ № 1-ФКЗ.'},
 {q:'Можно ли самому представлять свои интересы?',a:'Да. Обязательного представительства нет. Для привлечённого представителя действуют специальные требования к статусу и оформлению полномочий.'},
 {q:'Сколько стоит подача жалобы?',a:'По официальным данным: физическое лицо — 450 ₽, организация — 6 750 ₽. Возможны предусмотренные законом льготы, освобождение, уменьшение, отсрочка или рассрочка. Реквизиты надо проверить непосредственно перед платежом.'},
 {q:'Нужно ли дублировать электронную жалобу бумажной?',a:'Нет, если обращение корректно подано через официальный электронный сервис по предусмотренной процедуре.'},
 {q:'Сколько судей в Конституционном Суде?',a:'Закон предусматривает состав из 11 судей. На официальной странице персонального состава при подготовке этой карточки перечислены 10 действующих судей. Это разные показатели.'},
 {q:'Можно ли обратиться по электронной почте без электронной подписи?',a:'Обычный запрос справочной информации может быть направлен электронной почтой. Процессуальное электронное обращение на официальный e-mail должно быть подписано усиленной квалифицированной электронной подписью; альтернативой является официальный кабинет.'}
] as const;
function SecHeading({id,eyebrow,title,children}:{id:string;eyebrow:string;title:string;children?:React.ReactNode}){
 return <div className="constitutional-heading" id={id}>
  <span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{children?<p>{children}</p>:null}
 </div>;
}
export function ConstitutionalCourtDossier(){
 return <article className="constitutional-dossier">
  <nav className="constitutional-inpage" aria-label="Разделы карточки Конституционного Суда">
   {sections.map(([id,label])=><a key={id} href={'#'+id}>{label}</a>)}
  </nav>
  <section className="constitutional-hero" id="overview">
   <div className="constitutional-title">
    <span className="kicker">Эталонная подробная карточка · федеральный суд</span>
    <h1>Конституционный Суд Российской Федерации</h1>
    <p className="lead">Высший судебный орган конституционного контроля. Проверяет соответствие нормативных актов Конституции РФ, а не правильность установления фактов по обычному судебному спору.</p>
    <div className="constitutional-hero-actions">
     <a className="button button-red" href="#complaint">Как обратиться в суд ↓</a>
     <a className="button button-outline" href="#judges">Весь состав судей ↓</a>
    </div>
    <p className="constitutional-disclaimer">{stamp}. Это независимый справочник, не официальный сайт суда. Текущие реквизиты и персональный состав проверяйте перед юридически значимыми действиями.</p>
   </div>
   <div className="constitutional-photo">
    <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Конституционный_суд_РФ.jpg?width=1000"
      alt="Здание Конституционного Суда России на Сенатской площади в Санкт-Петербурге"
      loading="lazy" referrerPolicy="no-referrer"/>
    <p>Фотография здания: Monoklon, <a href="https://commons.wikimedia.org/wiki/File:Конституционный_суд_РФ.jpg" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Без изменений.</p>
   </div>
  </section>
  <div className="constitutional-stats" aria-label="Краткие сведения">
   <div><b>1991</b><small>год создания суда</small></div>
   <div><b>11</b><small>судей предусмотрено законом</small></div>
   <div><b>{CONSTITUTIONAL_JUDGES.length}</b><small>судей в опубликованном персональном составе</small></div>
   <div><b>СПб</b><small>постоянное местонахождение</small></div>
  </div>

  <section className="constitutional-block">
   <SecHeading id="judges" eyebrow="Состав суда" title="Председатель, заместитель и судьи">
    Здесь приведён весь персональный состав из официального раздела КС РФ на дату сверки. Дата назначения и краткие биографии размещены непосредственно на нашем сайте. По закону предусмотрено 11 судей, но официальный список содержит 10 фамилий — вакансия не заполнена вымышленной записью.
   </SecHeading>
   <div className="constitutional-judges">
    {CONSTITUTIONAL_JUDGES.map(j=><article className="constitutional-judge" key={j.id} id={'judge-'+j.id}>
      <div className="constitutional-judge-head">
       {j.portrait?<figure>
         <img src={j.portrait} alt={'Портрет: '+j.name} loading="lazy" referrerPolicy="no-referrer"/>
         <figcaption>{j.portraitCredit} <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">Лицензия</a>.</figcaption>
        </figure>:<div className="constitutional-judge-monogram" role="img" aria-label="Фотография не размещена: права на использование не подтверждены">{j.name.split(' ').slice(0,2).map(s=>s[0]).join('')}</div>}
       <div><span className="constitutional-role">{j.position}</span><h3>{j.name}</h3><p className="constitutional-date">{j.appointed}</p></div>
      </div>
      <p>{j.background}</p><p><strong>Специализация:</strong> {j.focus}</p>
      <p className="constitutional-source">Биография: <a href={j.source} target="_blank" rel="noopener noreferrer">официальная персональная страница</a></p>
     </article>)}
   </div>
   <p className="constitutional-small">Отсутствие фотографии означает лишь то, что право на её воспроизведение ещё не подтверждено. Все имена и должности сверяются по <a href="https://www.ksrf.ru/about/judges/" target="_blank" rel="noopener noreferrer">официальному персональному составу</a>.</p>
  </section>

  <section className="constitutional-block">
   <SecHeading id="contacts" eyebrow="Практическая информация" title="Адрес, приём граждан и контакты">
    Почтовый адрес суда и вход в приёмную — разные адреса. При планировании личного обращения ориентируйтесь на приёмную на Галерной улице.
   </SecHeading>
   <div className="constitutional-contact-grid">
    <div className="constitutional-fact">
     <h3>Конституционный Суд РФ</h3>
     <dl>
      <div><dt>Почтовый адрес</dt><dd>{CONSTITUTIONAL_CONTACTS.postalAddress}</dd></div>
      <div><dt>Общая справочная</dt><dd><a href="tel:+78124043311">+7 (812) 404-33-11</a> — автоматическая линия круглосуточно</dd></div>
      <div><dt>Контактный e-mail</dt><dd><a href="mailto:ksrf@ksrf.ru">ksrf@ksrf.ru</a></dd></div>
      <div><dt>Территория компетенции</dt><dd>Вся Российская Федерация</dd></div>
     </dl>
    </div>
    <div className="constitutional-fact">
     <h3>Приёмная граждан</h3>
     <dl>
      <div><dt>Адрес для личного приёма</dt><dd>{CONSTITUTIONAL_CONTACTS.receptionAddress}</dd></div>
      <div><dt>Понедельник — четверг</dt><dd>10:00–17:00</dd></div>
      <div><dt>Пятница и предпраздничные дни</dt><dd>10:00–16:00</dd></div>
      <div><dt>Перерыв</dt><dd>12:00–13:00</dd></div>
      <div><dt>Консультации в часы приёма</dt><dd><a href="tel:+78124043199">+7 (812) 404-31-99</a></dd></div>
     </dl>
    </div>
   </div>
   <YandexCourtMap code="ksrf-senate-1" name="Конституционный Суд Российской Федерации" address={CONSTITUTIONAL_CONTACTS.postalMapAddress}/>
   <p className="constitutional-small">Карта показывает почтовый адрес суда. Приёмная граждан находится отдельно на Галерной улице, 3; вход для посетителей открытых заседаний — Галерная, 1. Перед посещением уточните порядок прохода и расписание.</p>
   <div className="constitutional-contact-grid">
    <div className="constitutional-fact"><h3>Приёмная граждан</h3><p>{CONSTITUTIONAL_CONTACTS.receptionAddress}</p><p><a href={CONSTITUTIONAL_CONTACTS.receptionSource} target="_blank" rel="noopener noreferrer">Проверить контактные сведения</a></p><YandexCourtMap code="ksrf-reception" name="Приёмная Конституционного Суда РФ" address={CONSTITUTIONAL_CONTACTS.receptionMapAddress}/></div>
    <div className="constitutional-fact"><h3>Вход на открытые заседания</h3><p>{CONSTITUTIONAL_CONTACTS.hearingAddress}</p><p>Это не адрес приёмной граждан. Уточняйте порядок допуска.</p><p><a href={CONSTITUTIONAL_CONTACTS.hearingSource} target="_blank" rel="noopener noreferrer">Посещение заседаний</a></p><YandexCourtMap code="ksrf-hearings" name="Вход для посетителей заседаний" address={CONSTITUTIONAL_CONTACTS.hearingMapAddress}/></div>
   </div>
  </section>

  <section className="constitutional-block">
   <SecHeading id="competence" eyebrow="Статья 125 Конституции РФ и ФКЗ № 1-ФКЗ" title="Какие вопросы рассматривает суд">
    Основная задача — конституционный контроль. Конституционный Суд не пересматривает показания свидетелей, доказательства или размер присуждённых выплат вместо обычных судов.
   </SecHeading>
   <div className="constitutional-topic-grid">
    {topics.map(([name,desc],i)=><div className="constitutional-topic" key={name}><span>0{i+1}</span><h3>{name}</h3><p>{desc}</p></div>)}
   </div>
   <p className="constitutional-legal-note">Нормативная основа: статья 125 Конституции РФ, статьи 1, 3, 36, 96–97 Федерального конституционного закона от 21 июля 1994 года № 1-ФКЗ.</p>
  </section>

  <section className="constitutional-block">
   <SecHeading id="complaint" eyebrow="Для заявителей" title="Как подготовить обращение в Конституционный Суд">
    Все основные правила собраны здесь. Направляйте заявление только после оценки допустимости и исчерпания средств судебной защиты, если это требуется для вашего случая.
   </SecHeading>
   <div className="constitutional-process">
    {steps.map(s=><div key={s.number}><span>{s.number}</span><div><h3>{s.name}</h3><p>{s.desc}</p></div></div>)}
   </div>
   <ConstitutionalComplaintSelfCheck/>
   <h3 className="constitutional-subheading">Варианты подачи</h3>
   <div className="constitutional-methods">
    <div><b>По почте</b><p>{CONSTITUTIONAL_CONTACTS.postalAddress}. Сохраняйте доказательство направления и дату отправки.</p></div>
    <div><b>Лично</b><p>Через приёмную по адресу {CONSTITUTIONAL_CONTACTS.receptionAddress} в часы её работы.</p></div>
    <div><b>Через кабинет</b><p>Официальная электронная система с регистрацией заявителя.</p></div>
    <div><b>Электронной почтой</b><p>Процессуальная жалоба на ksrf@ksrf.ru — с усиленной квалифицированной электронной подписью.</p></div>
   </div>
   <div className="constitutional-fees">
    <div><span>Госпошлина для физического лица</span><strong>450 ₽</strong></div>
    <div><span>Госпошлина для организации</span><strong>6 750 ₽</strong></div>
    <p>Размеры по официальной информации суда. Допускаются законные основания освобождения, уменьшения или отсрочки. Проверяйте платёжные реквизиты непосредственно перед переводом.</p>
   </div>
   <div className="constitutional-hero-actions">
    <a className="button button-outline" href="https://www.ksrf.ru/Petition/algo/" target="_blank" rel="noopener noreferrer">Проверить право на обращение ↗</a>
    <a className="button button-outline" href="https://www.ksrf.ru/Petition/PrimerOfStructure.php" target="_blank" rel="noopener noreferrer">Примерная структура жалобы ↗</a>
    <a className="button button-red" href="https://petition.ksrf.ru/" target="_blank" rel="noopener noreferrer">Подать через официальный кабинет ↗</a>
    <a className="button button-outline" href="https://www.ksrf.ru/Petition/Requisites.php" target="_blank" rel="noopener noreferrer">Проверить реквизиты оплаты ↗</a>
    <a className="button button-outline" href="https://www.ksrf.ru/Petition/CurrentStatus.php" target="_blank" rel="noopener noreferrer">Проверить статус обращения ↗</a>
   </div>
  </section>

  <section className="constitutional-block">
   <SecHeading id="practice" eyebrow="Решения суда" title="Подборка реальной судебной практики">
    Краткое содержание и тема дела доступны на нашей странице. Для полного официального акта (PDF) или поиска по многолетнему архиву сохранена ссылка на первоисточник. Это примеры, а не полный каталог и не оценка исхода дела в пользу конкретной стороны.
   </SecHeading>
   <div className="constitutional-cases">
    {CONSTITUTIONAL_PRACTICE.map(item=><article key={item.number}>
     <div className="constitutional-case-meta"><strong>№ {item.number}</strong><time>{item.date}</time></div>
     <h3>{item.topic}</h3><p>{item.summary}</p>
     <a href={item.source} target="_blank" rel="noopener noreferrer">Открыть официальный материал и полный текст ↗</a>
    </article>)}
   </div>
   <p className="constitutional-small">Для поиска всех постановлений и определений — <a href="https://www.ksrf.ru/Decision/" target="_blank" rel="noopener noreferrer">официальный архив Конституционного Суда РФ</a>. Список выше зафиксирован на дату редакционной подборки.</p>
  </section>

  <section className="constitutional-block">
   <SecHeading id="office" eyebrow="Устройство суда" title="Секретариат и аппарат Конституционного Суда">
    Секретариат выполняет предварительную работу с поступившими обращениями; это не отдельная судебная инстанция. Ниже — руководители и функции подразделений из официально опубликованной структуры.
   </SecHeading>
   <div className="constitutional-office">
    {CONSTITUTIONAL_SECRETARIAT.map(x=><div key={x.section}><h3>{x.section}</h3><strong>{x.person}</strong><p>{x.scope}</p></div>)}
   </div>
   <p className="constitutional-small">В аппарат также входят Управление делами, Управление государственной службы и кадров, Финансовое управление, подразделения международных связей, пресс-служба, внутренний финансовый аудит, представительство в Москве и аппараты руководства суда.</p>
  </section>

  <section className="constitutional-block">
   <SecHeading id="history" eyebrow="Историческая справка" title="Основные этапы развития суда">
    Хронология приводится по официальному историческому разделу Конституционного Суда.
   </SecHeading>
   <div className="constitutional-timeline">
    <div><strong>1991</strong><p>12 июля принят первый закон о Конституционном Суде РСФСР; 30 октября состоялось первое рабочее совещание судей.</p></div>
    <div><strong>1992</strong><p>14 января прошло первое заседание Конституционного Суда РСФСР.</p></div>
    <div><strong>1993–1995</strong><p>После принятия Конституции 1993 года определена новая модель конституционного контроля; в 1994 году принят действующий ФКЗ № 1-ФКЗ, в 1995 году возобновилась работа Суда.</p></div>
    <div><strong>2008</strong><p>21 мая завершён переезд в комплекс Сената в Санкт-Петербурге.</p></div>
    <div><strong>2020</strong><p>Конституционная реформа закрепила действующую модель и штатный состав из 11 судей.</p></div>
   </div>
  </section>

  <section className="constitutional-block">
   <SecHeading id="questions" eyebrow="Частые вопросы" title="Ответы по работе и полномочиям Конституционного Суда">
    Информация ниже воспроизводит правовые критерии в кратком изложении и не заменяет оценку конкретного дела.
   </SecHeading>
   <div className="constitutional-faq">
    {questions.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}
   </div>
  </section>

  <section className="constitutional-block constitutional-provenance">
   <SecHeading id="sources" eyebrow="Прозрачность" title="Проверенные первоисточники">
    Все девять тем раскрываются в отдельных подробных разделах нашего проекта. Официальный первоисточник находится внутри каждого раздела — для проверки актуальности, кадровых изменений и юридически значимых действий.
   </SecHeading>
   <div className="constitutional-source-grid">{CONSTITUTIONAL_REFERENCE_TOPICS.map(x=><Link key={x.slug} href={CONSTITUTIONAL_REFERENCE_BASE+"/"+x.slug}>{x.shortTitle} →</Link>)}</div>
   <p className="constitutional-small">Фото здания — Monoklon (CC BY-SA 4.0). Для каждого размещённого портрета судьи указаны источник и лицензия CC BY 4.0; при отсутствии подтверждённого разрешения вместо изображения показана монограмма. Фотографии загружаются из Wikimedia Commons; для полностью локального хранения потребуется отдельное получение и сохранение файлов с лицензиями.</p>
  </section>
  <div className="constitutional-back"><Link href="/courts">← Вернуться в каталог судов России</Link></div>
 </article>;
}
