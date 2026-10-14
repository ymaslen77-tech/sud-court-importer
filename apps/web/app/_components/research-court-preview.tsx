import Link from 'next/link';
import type {ResearchCourt} from '../lib/research-courts';

export function ResearchCourtPreview({court}:{court:ResearchCourt}){
  const href='/courts/'+court.region;
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
      <Link href="/courts">Суды России</Link><span>/</span>
      <Link href={href}>{court.regionName}</Link><span>/</span>{court.name}</div>
    <section className="section-hero">
      <span className="kicker">Исследовательская карточка · не прошла редакционную приёмку</span>
      <h1>{court.name}</h1>
      <p className="lead">{court.kind} · {court.regionName}</p>
      <div className="notice" role="status"><span className="notice-dot" aria-hidden="true"/>
        Эти сведения взяты из открытой официальной региональной выдачи.
        Актуальность на сегодня и правильность контактных линий ещё не подтверждены.
      </div>
    </section>
    <div className="court-identity">
      <div><strong>Классификационный код в исходной выдаче</strong><span>{court.code}</span></div>
      <div><strong>Субъект РФ</strong><span>{court.regionName}</span></div>
      <div><strong>Тип</strong><span>{court.kind}</span></div>
      <div><strong>Статус проверки</strong><span>Требует повторной сверки</span></div>
    </div>
    <div className="court-detail-grid">
      <section className="detail-card">
        <span className="eyebrow">Сведения из исходного официального реестра</span>
        <h2>Адрес и контакты</h2>
        <dl className="court-facts">
          <div><dt>Адрес из реестра</dt><dd>{court.address??'В этом исследовательском списке адрес не указан'}</dd></div>
          <div><dt>Телефон из реестра</dt><dd>{court.phone??'Не указан в исходной записи'}</dd></div>
          <div><dt>Электронная почта из реестра</dt><dd>{court.email??'Не указана в исходной записи'}</dd></div>
          <div><dt>Актуальность</dt><dd>Не подтверждена на дату посещения этой страницы</dd></div>
        </dl>
        {court.address?<p className="court-source">
          <a href={'https://www.openstreetmap.org/search?query='+encodeURIComponent(court.address)}
            target="_blank" rel="noopener noreferrer">
            Найти этот адрес на OpenStreetMap ↗
          </a> — поиск по тексту адреса, точные координаты и вход в суд пока не проверены.
        </p>:null}
        {court.website?<p className="court-source">
          <a href={court.website} target="_blank" rel="noopener noreferrer">Перейти на официальный сайт суда ↗</a>
          {court.website.startsWith('http:')?' (ссылка реестра использует HTTP)':''}
        </p>:<p className="court-source">В исходном списке персональная ссылка на сайт судебного участка отсутствует. Используйте официальный региональный справочник.</p>}
      </section>
      <aside className="detail-card detail-side">
        <span className="eyebrow">Проверка перед обращением</span>
        <h2>Что нужно уточнить</h2>
        <p>Перед посещением суда или отправкой документов сверьте адрес, график работы, телефон нужного отдела и порядок подачи на официальном сайте.</p>
        <p>Фотография фасада, карта, состав судей и судебные дела не добавляются без самостоятельной проверки первоисточников.</p>
      </aside>
    </div>
    <section className="court-section">
      <span className="eyebrow">Происхождение информации</span>
      <h2>Официальный источник и редакционный статус</h2>
      <p>Название, классификационный код и справочные контакты перенесены в исследовательский набор из открытого регионального перечня ГАС «Правосудие». Перенос данных в исследовательский набор не означает редакционное утверждение.</p>
      <p><a href={court.source} target="_blank" rel="noopener noreferrer">Открыть региональный перечень ГАС «Правосудие» ↗</a></p>
      <p className="court-source">Дополнительный справочный поиск судебной практики:
        {' '}<a href={court.code.includes('MS')?'https://sudact.ru/magistrate/':'https://sudact.ru/regular/'}
          target="_blank" rel="noopener noreferrer">СудАкт ↗</a>.
        Это независимый агрегатор, не государственный первоисточник судебных сведений.</p>
      <p className="court-source">После повторной проверки сведения могут быть перенесены в основной подтверждённый реестр. Пока карточка не включается в индекс поисковых систем и sitemap.</p>
    </section>
    <section className="callout">
      <div><span className="eyebrow">Навигация</span><h2>Другие суды региона</h2>
        <p>Посмотрите исследовательские карточки региона или перейдите к уже подтверждённым записям, если они опубликованы.</p>
      </div>
      <div className="callout-links"><Link href={href}>Все суды региона →</Link>
        <Link href="/courts">Каталог судов России →</Link></div>
    </section>
  </>;
}
