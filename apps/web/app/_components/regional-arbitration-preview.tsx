import Link from 'next/link';
import type {RegionalArbitrationName} from '../lib/regional-arbitration';
import {findRegion} from '../lib/regions';

export function RegionalArbitrationPreview({court,region}:{court:RegionalArbitrationName;region:string}){
  const regionName=findRegion(region)?.name??'Регион не установлен';
  const home='/courts/'+encodeURIComponent(region);
  const label=court.courtKind==='arbitration-presence'?'Постоянное судебное присутствие':'Арбитражный суд субъекта РФ';
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
      <Link href="/courts">Суды России</Link><span>/</span>
      <Link href={home}>{regionName}</Link><span>/</span>{court.courtName}</div>
    <section className="section-hero">
      <span className="kicker">Предварительная справочная запись · требует проверки</span>
      <h1>{court.courtName}</h1>
      <p className="lead">{label} · {regionName}</p>
      <div className="notice" role="status"><span className="notice-dot" aria-hidden="true"/>
        Имя суда перенесено из ранее сохранённого официального перечня. Актуальный статус,
        компетенция, контакты, состав судей и сведения о делах ещё не сверены.
      </div>
    </section>
    <div className="court-identity">
      <div><strong>Раздел</strong><span>{label}</span></div>
      <div><strong>Регион навигации</strong><span>{regionName}</span></div>
      <div><strong>Статус</strong><span>Исследовательский справочник, не прошёл редакционную приёмку</span></div>
    </div>
    <div className="court-detail-grid">
      <section className="detail-card">
        <span className="eyebrow">Проверка перед обращением</span>
        <h2>Адрес и контакты</h2>
        <p>Подтверждённого адреса, телефона и графика работы для этой записи ещё нет.
        Не используйте предполагаемые реквизиты для отправки документов.</p>
        <p><a className="text-link" href={court.sourceRecordUrl} target="_blank" rel="noopener noreferrer">
          Открыть официальный перечень арбитражных судов ↗
        </a></p>
      </section>
      <aside className="detail-card detail-side">
        <span className="eyebrow">Что будет добавлено после проверки</span>
        <h2>Полная карточка суда</h2>
        <p>Официальные адрес и контакты, карта с подтверждёнными координатами,
        состав судей по документам о назначении, дела и ссылки на процессуальные сервисы.</p>
      </aside>
    </div>
    <section className="court-section">
      <span className="eyebrow">Происхождение записи</span>
      <h2>Официальный первоисточник</h2>
      <p>Название суда взято из сохранённого в проекте справочного перечня, ссылающегося
      на арбитражный портал. Публикация названия не подтверждает работу суда
      по конкретному адресу или территориальную подсудность.</p>
      <p><a href={court.sourceRecordUrl} target="_blank" rel="noopener noreferrer">Проверить первоисточник ↗</a></p>
      <p className="court-source">Карточка закрыта от поисковой индексации до повторной редакционной проверки.</p>
    </section>
    <section className="callout">
      <div><span className="eyebrow">Навигация</span><h2>Другие суды региона</h2>
        <p>Откройте все доступные справочные записи и опубликованные карточки.</p>
      </div><Link className="button button-outline" href={home}>Каталог региона →</Link>
    </section>
  </>;
}
