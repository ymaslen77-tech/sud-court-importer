import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {editorConfigured,hasEditorCredentials,loadEditorOverview} from '../../lib/editor-auth';

export const dynamic='force-dynamic';
export const metadata:Metadata={
 title:'Редакционный кабинет — служебный доступ',robots:{index:false,follow:false}
};
const labels:Record<string,string>={
 court_profiles:'Изменения карточек',judge_appointments:'Назначения судей',
 staff_rosters:'Наблюдения о составе судов',registry_diffs:'Сравнение реестров',
 source_changes:'Изменения страниц источников',case_references:'Ссылки на дела'
};

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
    <span className="eyebrow">Очередь редактора</span><h2>Необработанные изменения</h2>
    <div className="editor-queues">{report.review_queues.map(item=><div key={item.kind}>
     <span>{labels[item.kind]??item.kind}</span><strong>{item.count}</strong>
    </div>)}</div>
    <p className="court-source">Числа показывают ожидающие рассмотрения записи. Они не доказывают фактическое изменение сведений в конкретном суде.</p>
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
    <span className="eyebrow">Покрытие</span><h2>Опубликованные суды по регионам</h2>
    {report.by_region.length?<div className="editor-queues">
      {report.by_region.map(region=><div key={region.code}><span>{region.name}</span><strong>{region.published}</strong></div>)}
    </div>:<div className="empty-state">Проверенных судов в публичной базе пока нет. Предварительные записи не считаются опубликованными.</div>}
    <p className="court-source">Полноту реестра по субъектам РФ необходимо подтверждать отдельно: отсутствие региона здесь не означает отсутствия судов.</p>
   </section>
  </>}
 </div>;
}
