import Link from 'next/link';
import dossier from '../data/north-caucasus-cassation-dossier.json';
import {findRegion} from '../lib/regions';

type Props={region:string};
function Source({href,children}:{href:string;children:React.ReactNode}){
  return <a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>;
}

export function NorthCaucasusCassationDossier({region}:Props){
  const selected=findRegion(region)?.name??'Регион';
  const mapText=dossier.courtName+', '+dossier.addressForMap;
  // Geocoder search only: do not pretend to have GPS-level certified entrance coordinates.
  const mapEmbed='https://yandex.ru/map-widget/v1/?'+new URLSearchParams({text:mapText,z:'15'}).toString();
  const mapLink='https://yandex.ru/maps/?'+new URLSearchParams({text:mapText}).toString();
  const territory=dossier.jurisdictions.map(slug=>({slug,name:findRegion(slug)?.name??slug}));
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
      <Link href="/courts">Суды России</Link><span>/</span>
      <Link href={'/courts/'+region}>{selected}</Link><span>/</span>{dossier.courtName}
    </div>
    <section className="section-hero">
      <span className="kicker">Арбитражная кассация · Северо-Кавказский судебный округ</span>
      <h1>{dossier.courtName}</h1>
      <p className="lead">Кассационная инстанция по арбитражным делам, в том числе по судебным актам
        арбитражных судов {selected==='Кабардино-Балкарская Республика'?'Кабардино-Балкарской Республики':'региона '+selected}.
        Суд располагается в Краснодаре, а его территориальная компетенция охватывает 11 субъектов РФ.</p>
      <div className="notice" role="note"><span className="notice-dot" aria-hidden="true"/>
        Адрес, контакты и правовые основания сверены по доступным справочникам и нормам права 22.10.2026.
        Собственный сайт суда ограничил автоматическую проверку отдельных сведений.
        Текущие назначения всех судей, расписание приёма и платёжные реквизиты требуют дополнительной сверки.
      </div>
      <p><Source href={dossier.officialSite}>Официальный сайт суда</Source></p>
    </section>

    <nav className="court-toc" aria-label="Разделы карточки арбитражного суда">
      <strong>На этой странице</strong>
      <a href="#nc-contacts">Контакты</a>
      <a href="#nc-map">Карта и проезд</a>
      <a href="#nc-territory">Судебный округ</a>
      <a href="#nc-filing">Подача кассации</a>
      <a href="#nc-fee">Госпошлина</a>
      <a href="#nc-judges">Руководство и судьи</a>
      <a href="#nc-cases">Дела и заседания</a>
      <a href="#nc-sources">Источники</a>
    </nav>

    <div className="court-identity">
      <div><strong>Уровень</strong><span>Арбитражный суд округа · кассационная инстанция</span></div>
      <div><strong>Индекс суда в справочниках</strong><span>{dossier.courtClassCode}</span></div>
      <div><strong>Местонахождение</strong><span>{dossier.regionOfSeat} (не Кабардино-Балкария)</span></div>
      <div><strong>Регион поиска</strong><span>{selected}</span></div>
    </div>

    <div className="court-detail-grid">
      <section id="nc-contacts" className="detail-card">
        <span className="eyebrow">Справочные сведения</span>
        <h2>Адрес и контакты</h2>
        <dl className="court-facts">
          <div><dt>Почтовый адрес</dt><dd>{dossier.postalAddress}</dd></div>
          <div><dt>Основной телефон</dt><dd><a href="tel:+78612013400">{dossier.mainPhone}</a></dd></div>
          <div><dt>Справочная</dt><dd><a href="tel:+78612013405">{dossier.referencePhone}</a></dd></div>
          <div><dt>Электронная почта</dt><dd><a href={'mailto:'+dossier.email}>{dossier.email}</a></dd></div>
          <div><dt>Официальный сайт</dt><dd><Source href={dossier.officialSite}>fassko.arbitr.ru</Source></dd></div>
        </dl>
        <p className="court-source">Контактные данные: <Source href={dossier.contactDirectorySource}>юридический справочник суда</Source>.
          Телефоны, адрес для корреспонденции и часы приёма необходимо уточнить непосредственно перед обращением.</p>
        <p className="court-source">Обычная электронная почта не заменяет процессуальную подачу документов.
          Для неё предусмотрен сервис «Мой арбитр».</p>
      </section>
      <aside className="detail-card detail-side">
        <span className="eyebrow">Управление судом</span>
        <h2>Председатель суда</h2>
        <p><strong>{dossier.leader}</strong></p>
        <p>{dossier.leaderRole}</p>
        <p className="court-source">Должность подтверждается сообщением государственного Судебного департамента:
          {' '}<Source href={dossier.leaderSource}>официальный источник</Source>.</p>
        <p className="court-source">Список остальных действующих судей и председателей судебных составов не приводится
          без текущего подтверждения назначений.</p>
      </aside>
    </div>

    <section id="nc-map" className="court-section">
      <span className="eyebrow">Расположение · Краснодар</span>
      <h2>Карта и как добраться</h2>
      <p><strong>{dossier.postalAddress}</strong>. На интерактивной карте выполняется поиск по тексту адреса,
        а не отображаются неподтверждённые GPS-координаты входа.</p>
      <div className="court-yandex-frame">
        <iframe title={'Яндекс Карты: '+dossier.courtName} src={mapEmbed}
          loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
      </div>
      <p className="court-source"><Source href={mapLink}>Открыть Яндекс Карты и построить маршрут</Source>.
        Доступность входа, парковка, пропускной режим и специальные условия посещения
        требуют сверки на официальном сайте суда.</p>
    </section>

    <section id="nc-territory" className="court-section">
      <span className="eyebrow">Статья 24 ФКЗ от 28.04.1995 № 1-ФКЗ</span>
      <h2>Территориальная компетенция — 11 субъектов РФ</h2>
      <p>Арбитражный суд Северо-Кавказского округа проверяет в кассационном порядке
        законность судебных актов арбитражных судов перечисленных субъектов
        и образованных в округе арбитражных апелляционных судов.</p>
      <div className="results">{territory.map(item=><Link className="result-row" key={item.slug}
        href={'/courts/'+item.slug}>
        <span><strong>{item.name}</strong><small>{item.slug===region?'Выбранный регион · кассационная компетенция':'Суды региона · кассационная компетенция округа'}</small></span>
        <span aria-hidden="true">↗</span>
      </Link>)}</div>
      <p className="court-source"><Source href={dossier.territorialLaw}>ФКЗ № 1-ФКЗ, статья 24, пункт 2, подпункт 8</Source>.
        Территория кассационного округа и физический адрес суда — разные сведения.</p>
      <p>Помимо кассационного пересмотра арбитражные суды округов рассматривают в первой инстанции
        заявления о компенсации за нарушение права на судопроизводство или исполнение судебного акта
        в разумный срок в предусмотренных законом случаях.</p>
    </section>

    <section id="nc-filing" className="court-section">
      <span className="eyebrow">Практическая инструкция</span>
      <h2>Как подать кассационную жалобу</h2>
      <div className="court-evidence-grid">
        <article className="evidence-item"><h3>1. Проверьте обжалуемый акт</h3>
          <p>Убедитесь, что жалоба подлежит рассмотрению арбитражным судом округа,
            соблюдены правила обжалования и предусмотренный порядок прохождения инстанций.</p></article>
        <article className="evidence-item"><h3>2. Рассчитайте срок</h3>
          <p>По общему правилу срок составляет два месяца со дня вступления обжалуемого акта в законную силу.
            Для отдельных категорий и актов предусмотрены специальные сроки. При пропуске срока оцените основания восстановления.</p></article>
        <article className="evidence-item"><h3>3. Подготовьте жалобу и приложения</h3>
          <p>Укажите суд, стороны, обжалуемые акты, доводы и требования; приложите документы по статье 277 АПК РФ,
            включая подтверждение направления копий участникам и уплаты пошлины либо льготы/ходатайства.</p></article>
        <article className="evidence-item"><h3>4. Направьте через суд первой инстанции</h3>
          <p>Как правило, жалобу в кассационный суд округа подают через арбитражный суд, принявший решение,
            а не непосредственно по адресу кассационного суда. Суд первой инстанции пересылает её с делом.</p></article>
        <article className="evidence-item"><h3>5. Используйте электронную подачу</h3>
          <p><Source href="https://my.arbitr.ru/">Мой арбитр</Source> — официальный сервис.
            Выберите нужное дело и надлежащий процессуальный тип обращения.</p></article>
        <article className="evidence-item"><h3>6. Отслеживайте движение дела</h3>
          <p>Проверяйте карточку дела и опубликованные определения в КАД; перед заседанием уточняйте время и зал.</p></article>
      </div>
      <p className="court-source">Нормы: <Source href={dossier.procedureLaw}>глава 35 АПК РФ</Source>,
        {' '}<Source href={dossier.filingLaw}>ст. 275</Source>,
        {' '}<Source href={dossier.deadlineLaw}>ст. 276</Source>,
        {' '}<Source href={dossier.supremePlenum}>Пленум ВС РФ от 30.06.2020 № 13</Source>.</p>
    </section>

    <section id="nc-fee" className="court-section">
      <span className="eyebrow">Налоговый кодекс · октябрь 2026</span>
      <h2>Госпошлина и платёжные реквизиты</h2>
      <div className="court-identity">
        <div><strong>Физические лица</strong><span>20 000 ₽ — обычная кассационная жалоба</span></div>
        <div><strong>Организации</strong><span>50 000 ₽ — обычная кассационная жалоба</span></div>
      </div>
      <p>Это размеры по подпункту 20 пункта 1 статьи 333.21 НК РФ;
        в отдельных случаях действуют особые ставки, освобождения, льготы, отсрочка или рассрочка.</p>
      <p><strong>Банковские реквизиты не подставляются автоматически.</strong>
        Получатель, КБК, ОКТМО и иные поля платежа должны быть перепроверены
        для конкретного обращения по официальному сервису или информации суда непосредственно перед оплатой.
        Реквизиты самого суда как юридического лица не являются реквизитами госпошлины.</p>
      <p className="court-source"><Source href={dossier.taxLaw}>НК РФ, статья 333.21</Source>.
        Отдельно проверьте статьи 333.22, 333.35, 333.37 и 333.41 НК РФ.</p>
    </section>

    <section id="nc-judges" className="court-section">
      <span className="eyebrow">Судейский состав</span>
      <h2>Руководство и судьи</h2>
      <div className="judge-verified-list">
        <article><h3>{dossier.leader}</h3>
          <p>Председатель Арбитражного суда Северо-Кавказского округа.</p>
          <small><Source href={dossier.leaderSource}>Судебный департамент при Верховном Суде РФ</Source></small>
        </article>
      </div>
      <div className="notice" role="note">Полный состав судей, актуальное распределение по судебным коллегиям
        и судебным составам пока не подтверждены по действующей странице суда и документам о назначении.
        Исторические списки судей не публикуются как действующие.</div>
    </section>

    <section id="nc-cases" className="court-section">
      <span className="eyebrow">Официальное электронное правосудие</span>
      <h2>Судебные дела, решения и заседания</h2>
      <p>Официальные системы позволяют искать дела по номеру, суду, участникам, судье и дате,
        смотреть судебные акты и календарь заседаний. При поиске выберите
        «Арбитражный суд Северо-Кавказского округа» или укажите номер дела.</p>
      <div className="court-evidence-grid">{dossier.publicSystems.map(service=><article key={service.url} className="evidence-item">
        <h3>{service.title}</h3><p>{service.description}</p>
        <p><Source href={service.url}>Открыть сервис</Source></p>
      </article>)}</div>
      <p className="court-source">Полная локальная выгрузка дел и актуального календаря из официальной системы
        не получена. Поэтому здесь не публикуются придуманные номера дел, судьи, залы
        и утверждения о заседаниях «сегодня». Данные в официальных сервисах могут обновляться.</p>
    </section>

    <section id="nc-sources" className="court-section">
      <span className="eyebrow">Происхождение и актуальность</span>
      <h2>Источники и пределы проверки</h2>
      <p>Сверка доступных публикаций: <strong>22 октября 2026 года</strong>.
        Эта карточка — самостоятельный справочник, а не официальный сайт или электронная приёмная.</p>
      <div className="court-evidence-grid">
        <article className="evidence-item"><h3>Закон и территориальная компетенция</h3>
          <p><Source href={dossier.territorialLaw}>Федеральный конституционный закон № 1-ФКЗ</Source></p></article>
        <article className="evidence-item"><h3>Адрес, телефоны и почта</h3>
          <p><Source href={dossier.contactDirectorySource}>Справочник КонсультантПлюс</Source>.
            Прямая сверка личного сайта суда не завершена.</p></article>
        <article className="evidence-item"><h3>Председатель суда</h3>
          <p><Source href={dossier.leaderSource}>Судебный департамент</Source>.</p></article>
        <article className="evidence-item"><h3>Процесс и судебные дела</h3>
          <p><Source href={dossier.procedureLaw}>АПК РФ</Source>,
            {' '}<Source href="https://kad.arbitr.ru/">КАД</Source> и
            {' '}<Source href="https://rad.arbitr.ru/">официальное расписание</Source>.</p></article>
      </div>
      <h3>Что ещё требует документальной сверки</h3>
      <ul>{dossier.pendingVerification.map(item=><li key={item}>{item}</li>)}</ul>
      <p className="court-source">Редакционная приёмка ещё не закрыта; до её завершения страница закрыта
        от поисковой индексации. Не следует считать непроверенные поля действующими.</p>
    </section>
    <section className="callout">
      <div><span className="eyebrow">Другие разделы</span>
        <h2>Вернуться к судам {selected}</h2>
        <p>Посмотрите суды первой инстанции региона или перейдите к общему поиску судебных органов.</p></div>
      <div className="callout-links"><Link href={'/courts/'+region}>Суды региона →</Link>
        <Link href="/search">Поиск суда →</Link>
        <Link href="/jurisdiction">Подсудность →</Link></div>
    </section>
  </>;
}
