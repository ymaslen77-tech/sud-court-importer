import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {editorConfigured,hasEditorCredentials,loadEditorOverview,editorReviewToken} from '../../lib/editor-auth';

export const dynamic='force-dynamic';
export const metadata:Metadata={
 title:'Редакционный кабинет — служебный доступ',robots:{index:false,follow:false}
};
const labels:Record<string,string>={
 court_candidates:'Суды с полным исходным профилем — ожидают проверки',
 court_discoveries:'Предварительные списки судов и судебных участков',
 court_profiles:'Изменения карточек',judge_appointments:'Назначения судей',
 staff_rosters:'Наблюдения о составе судов',staff_roster_diffs:'Изменения списков судей (требуют проверки)',registry_diffs:'Сравнение реестров',
 source_changes:'Изменения страниц источников',contact_deltas:'Изменения телефонов и e-mail (требуют проверки)',case_references:'Ссылки на дела'
};


function safeEvidenceUrl(value:string):string|null{
 try{
  const u=new URL(value);
  const host=u.hostname.toLowerCase();
  const permitted=['sudrf.ru','msudrf.ru','mos-gorsud.ru','arbitr.ru','pravo.gov.ru'];
  return u.protocol==='https:' && permitted.some(h=>host===h||host.endsWith('.'+h))?u.toString():null;
 }catch{return null;}
}
export default async function EditorDashboard(){
 if(!editorConfigured()||!await hasEditorCredentials())notFound();
 let report:Awaited<ReturnType<typeof loadEditorOverview>>|null=null;
 let failed=false;
 try{report=await loadEditorOverview();}catch{failed=true;}
 return <div className="editor-desk">
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>Редакционный кабинет</div>
  <section className="section-hero">
   <span className="kicker">Доступ только редакторам</span>
   <h1>Контроль наполнения судов</h1>
   <p className="lead">Состояние проверенных карточек, официальных источников и очередей изменений. Публичная публикация возможна только после отдельного редакционного утверждения.</p>
   <div className="notice"><span className="notice-dot" aria-hidden="true"/>
    Кабинет предназначен для просмотра. Утверждение происходит через проверяемые команды импортёра, а не автоматически.</div>
  </section>
  {failed||!report?<section className="court-section" role="alert"><h2>Данные кабинета недоступны</h2>
   <p>Внутренний API не ответил или не настроен. Никакие данные не были изменены. Проверьте токен, подключение к API и базу.</p>
  </section>:<>
   <section className="section-wrap">
    <span className="eyebrow">Последняя синхронизация метрик</span>
    <p>{new Date(report.generated_at).toLocaleString('ru-RU',{timeZone:'UTC'})} UTC</p>
    <div className="editor-summary">
     <article><strong>{report.public_courts.published}</strong><span>Публичных проверенных судов</span></article>
     <article><strong>{report.public_courts.stale}</strong><span>Карточек со старой базовой проверкой</span></article>
     <article><strong>{report.source_monitor.enabled}</strong><span>Включённых источников мониторинга</span></article>
     <article><strong>{report.source_monitor.overdue+report.source_monitor.failed}</strong><span>Просроченных проверок / ошибок (включая возможное пересечение)</span></article>
    </div>
   </section>
   <section className="court-section">
    <span className="eyebrow">Содержимое публичных карточек</span>
    <h2>Фактическая полнота проверенных данных</h2>
    <p>Счётчики показывают, в скольких из опубликованных судов присутствует конкретное проверенное поле. Присутствие сведений не гарантирует их актуальность вне указанного окна контроля.</p>
    <div className="editor-summary">
      {([
        ['Классификационный код','with_identifier'],
        ['Адрес','with_address'],
        ['Телефон','with_phone'],
        ['E-mail','with_email'],
        ['Официальный сайт','with_official_url'],
        ['Часы работы или приёма','with_hours'],
        ['Ссылка на подсудность','with_jurisdiction'],
        ['Актуально подтверждённые судьи','with_current_judge'],
        ['Проверенные ссылки на дела','with_case'],
        ['Фото фасада с лицензией','with_facade'],
        ['Координаты, проверенные за 180 дней','with_recent_coordinates']
      ] as const).map(([label,key])=><article key={key}>
        <strong>{report.quality_metrics[key]}<span className="editor-quality-total"> / {report.public_courts.published}</span></strong>
        <span>{label}</span>
      </article>)}
    </div>
    <p className="court-source">Показатели относятся только к опубликованным судам в текущей базе. Они не измеряют количество всех действующих судов России и не допускают автоматической публикации предварительных данных.</p>
   </section>
   <section className="court-section">
    <span className="eyebrow">Кандидаты официальных судов</span>
    <h2>Записи, ожидающие редакционного подтверждения</h2>
    <p>Просматривайте идентификаторы, актуальную версию каждого снимка, адрес, URL суда и контрольную сумму источника. Открытие списка не публикует данные.</p>
    <div className="editor-worklinks">
      <Link className="button button-outline" href="/editor/pilot">Первая десятка: редакционная проверка →</Link>
      <Link className="button button-outline" href="/editor/candidates">Кандидаты с полным профилем →</Link>
      <Link className="button button-outline" href="/editor/discoveries">Предварительные списки →</Link>
    </div>
   </section>
   <section className="court-section">
    <span className="eyebrow">Очередь редактора</span><h2>Необработанные изменения</h2>
    <div className="editor-queues">{report.review_queues.map(item=><div key={item.kind}>
     <span>{labels[item.kind]??item.kind}</span><strong>{item.count}</strong>
    </div>)}</div>
    <p className="court-source">Числа показывают ожидающие рассмотрения записи. Они не доказывают фактическое изменение сведений в конкретном суде.</p>
   </section>
   <section className="court-section">
    <span className="eyebrow">Разбор фактических изменений</span>
    <h2>Последние записи в очереди</h2>
    {report.recent_review_items.length?<div className="editor-review-list">
      {report.recent_review_items.map(item=><article key={item.kind+':'+item.item_id}>
        <div className="editor-review-title"><strong>{labels[item.kind]??item.kind}</strong>
          <span>№ {item.item_id}</span></div>
        <h3>{item.court}</h3>
        <p><b>{item.field}</b>: {item.value}</p>
        <div className="editor-review-source">
          <span>Обнаружено: {new Date(item.observed_at).toLocaleString('ru-RU',{timeZone:'UTC'})} UTC</span>
          {safeEvidenceUrl(item.source_url)?<a href={safeEvidenceUrl(item.source_url)!} target="_blank"
            rel="noopener noreferrer">Официальное свидетельство ↗</a>:<span>Источник требует сверки</span>}
        </div>
        {(['staff_roster_diffs','registry_diffs','source_changes','contact_deltas'] as string[]).includes(item.kind)?
        <form className="editor-review-form" method="post" action="/editor/review">
          <input type="hidden" name="kind" value={item.kind}/>
          <input type="hidden" name="itemId" value={item.item_id}/>
          <input type="hidden" name="csrf" value={editorReviewToken(item.item_id,item.kind)}/>
          <label><input type="checkbox" name="attest" required/>
            Я проверил первоисточник. Рассматривается только обнаруженное расхождение,
            без утверждения фактов о суде или должности судьи
          </label>
          <div>
            <button name="decision" value="reviewed" type="submit">Сигнал рассмотрен</button>
            <button name="decision" value="ignored" type="submit">Игнорировать сигнал</button>
          </div>
        </form>:null}
      </article>)}
    </div>:<div className="empty-state">В этих очередях пока нет неподтверждённых изменений.</div>}
    <p className="court-source">Просмотр записи или открытие источника не меняет её статус. Для подтверждения используйте отдельный механизм редакционной проверки.</p>
   </section>
   <section className="court-section">
    <span className="eyebrow">Источники</span><h2>Работа фонового мониторинга</h2>
    <dl className="court-facts">
     <div><dt>Включено наблюдений</dt><dd>{report.source_monitor.enabled}</dd></div>
     <div><dt>Просрочено</dt><dd>{report.source_monitor.overdue}</dd></div>
     <div><dt>Источники с ошибками</dt><dd>{report.source_monitor.failed}</dd></div>
     <div><dt>Последняя успешная проверка</dt><dd>{report.source_monitor.last_checked??
       'Пока не зафиксирована'}</dd></div>
    </dl>
   </section>
   <section className="court-section">
     <span className="eyebrow">Проверки загрузки файлов</span>
     <h2>Последние прогоны импортёра</h2>
     {report.intake_recent_runs.length?<div className="editor-queues">
       {report.intake_recent_runs.map(run=><div key={run.id}>
         <span>Прогон № {run.id} · {new Date(run.finished_at).toLocaleString('ru-RU',{timeZone:'UTC'})} UTC
           <small> · Проверено файлов: {run.manifest_count}</small></span>
         <strong>{run.handled} / {run.failed} ошибок</strong>
       </div>)}
     </div>:<div className="empty-state">Зафиксированных запусков файлового импортёра пока нет.</div>}
     <p className="court-source">Отчёт фиксирует успешный разбор файлов и ошибки. Он не доказывает актуальность официального источника и не подтверждает круглосуточную работу внешнего сервера.</p>
   </section>
   <section className="court-section">
    <span className="eyebrow">Покрытие</span><h2>Опубликованные суды по регионам</h2>
    {report.by_region.length?<div className="editor-queues">
      {report.by_region.map(region=><div key={region.code}><span>{region.name}</span><strong>{region.published}</strong></div>)}
    </div>:<div className="empty-state">Проверенных судов в публичной базе пока нет. Предварительные записи не считаются опубликованными.</div>}
    <p className="court-source">Полноту реестра по субъектам РФ необходимо подтверждать отдельно: отсутствие региона здесь не означает отсутствия судов.</p>
   </section>
  </>}
 </div>;
}
