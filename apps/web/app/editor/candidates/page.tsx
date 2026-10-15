import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {editorConfigured,hasEditorCredentials,loadEditorCandidates} from '../../lib/editor-auth';

export const dynamic='force-dynamic';
export const metadata:Metadata={
  title:'Кандидаты судов — закрытая редакционная очередь',
  robots:{index:false,follow:false}
};
type Props={searchParams:Promise<{page?:string|string[]}>};

function trustedSource(raw:string):string|null{
  try{
    const u=new URL(raw);
    const hosts=['sudrf.ru','msudrf.ru','mos-gorsud.ru','arbitr.ru','pravo.gov.ru'];
    return u.protocol==='https:' && !u.username && !u.password &&
      hosts.some(host=>u.hostname===host||u.hostname.endsWith('.'+host))
      ?u.toString():null;
  }catch{return null;}
}

export default async function CandidatesPage({searchParams}:Props){
  if(!editorConfigured()||!await hasEditorCredentials())notFound();
  const query=await searchParams;
  const raw=typeof query.page==='string'?query.page:'1';
  const page=/^[1-9][0-9]{0,3}$/.test(raw)?Number(raw):1;
  let data:Awaited<ReturnType<typeof loadEditorCandidates>>|null=null;
  try{data=await loadEditorCandidates(page);}catch{}
  const pages=data?Math.ceil(data.total/data.pageSize):0;
  const route='/editor/candidates';
  return <div className="editor-desk">
    <div className="breadcrumb"><Link href="/editor/dashboard">Редакционный кабинет</Link>
      <span>/</span>Кандидаты судов</div>
    <section className="section-hero">
      <span className="kicker">Закрытая очередь редактора</span>
      <h1>Суды, ожидающие проверки</h1>
      <p className="lead">Последняя запись каждого суда внутри отдельного источника. Исторические дубликаты не увеличивают счётчик кандидатов.</p>
      <div className="notice"><span className="notice-dot" aria-hidden="true"/>
        Это предварительные сведения, а не опубликованные и проверенные суды.
        Просмотр не подтверждает действительность адресов, судей или телефонов.</div>
    </section>
    <section className="section-wrap">
      {!data?<div role="alert" className="notice">Не удалось загрузить закрытую очередь. Публичные данные не изменились.</div>
      : <>
        <p>Ожидают индивидуальной сверки: <strong>{data.total}</strong>.
          {pages>0?' Страница '+data.page+' из '+pages+'.':''}</p>
        {data.items.length?<div className="editor-review-list">
          {data.items.map(item=><article key={item.candidate_id}>
            <div className="editor-review-title"><strong>{item.external_code}</strong>
              <span>Пакет № {item.batch_id}</span></div>
            <h2>{item.court_name}</h2>
            <p>{item.court_type} · {item.address}</p>
            <dl className="court-facts">
              <div><dt>Телефон</dt><dd>{item.phone||'Отсутствует'}</dd></div>
              <div><dt>E-mail</dt><dd>{item.email||'Отсутствует'}</dd></div>
              <div><dt>Дата снимка</dt><dd>{item.captured_on||'Не подтверждена'}</dd></div>
              <div><dt>Контрольный SHA-256</dt><dd className="editor-digest">
                {item.snapshot_sha256||'Не сохранён'}</dd></div>
            </dl>
            <p className="court-source">Подтверждение условий использования:
              {' '}{item.source_rights_attested?'отмечено оператором (не является лицензией)':'не зафиксировано'}.</p>
            <div className="editor-review-source">
              {trustedSource(item.official_url)?<a href={trustedSource(item.official_url)!}
                rel="noopener noreferrer" target="_blank">Страница суда ↗</a>:<span>Адрес суда требует проверки</span>}
              {trustedSource(item.source_url)?<a href={trustedSource(item.source_url)!}
                rel="noopener noreferrer" target="_blank">Исходная публикация ↗</a>:<span>Проверить источник</span>}
            </div>
            <p className="court-source">Для публикации используйте независимую ручную проверку и
              {' '}<code>importer/cli.py approve --batch {item.batch_id} --code {item.external_code}</code>
              {' '}с остальными обязательными параметрами и подтверждениями.</p>
          </article>)}
        </div>:<div className="empty-state">На этой странице нет кандидатов. Если всего ожидают 0 — очередь пуста.</div>}
        {pages>1?<nav className="category-pagination" aria-label="Навигация по очереди кандидатов">
          {data.page>1?<Link href={data.page===2?route:route+'?page='+(data.page-1)}>← Предыдущая</Link>:<span/>}
          <span>Страница {data.page} / {pages}</span>
          {data.page<pages?<Link href={route+'?page='+(data.page+1)}>Следующая →</Link>:<span/>}
        </nav>:null}
      </>}
    </section>
    <section className="callout">
      <div><h2>Публикация — только после проверки</h2>
        <p>Сверьте официальный судебный код, название, действующий адрес, контакты и реквизиты источника. Наличие строки в импортёре не является основанием для публикации.</p></div>
      <Link href="/editor/dashboard" className="button button-outline">В кабинет редактора →</Link>
    </section>
  </div>;
}
