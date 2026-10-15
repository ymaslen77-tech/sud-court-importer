import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {editorConfigured,hasEditorCredentials,loadEditorDiscoveries} from '../../lib/editor-auth';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Предварительные сведения о судах — редактор',
  robots:{index:false,follow:false}};
type Props={searchParams:Promise<{page?:string|string[]}>};

function trustedSource(raw:string|null):string|null{
  if(!raw)return null;
  try{
    const u=new URL(raw);
    const hosts=['sudrf.ru','msudrf.ru','mos-gorsud.ru','arbitr.ru','pravo.gov.ru'];
    return u.protocol==='https:' && !u.username && !u.password &&
      hosts.some(host=>u.hostname===host||u.hostname.endsWith('.'+host))
      ?u.toString():null;
  }catch{return null;}
}

export default async function DiscoveriesPage({searchParams}:Props){
  if(!editorConfigured()||!await hasEditorCredentials())notFound();
  const input=await searchParams;
  const requested=typeof input.page==='string'?input.page:'1';
  const page=/^[1-9][0-9]{0,3}$/.test(requested)?Number(requested):1;
  let data:Awaited<ReturnType<typeof loadEditorDiscoveries>>|null=null;
  try{data=await loadEditorDiscoveries(page);}catch{}
  const pages=data?Math.ceil(data.total/data.pageSize):0;
  const route='/editor/discoveries';
  return <div className="editor-desk">
    <div className="breadcrumb"><Link href="/editor/dashboard">Редакционный кабинет</Link>
      <span>/</span>Предварительные выборки</div>
    <section className="section-hero">
      <span className="kicker">Закрытый исследовательский реестр</span>
      <h1>Предварительные сведения о судах</h1>
      <p className="lead">Названия судов и участков из исходных списков, которым не хватает необходимых сведений для публикации.</p>
      <div className="notice"><span className="notice-dot" aria-hidden="true"/>
        Наличие записи не означает существование отдельного действующего суда на текущую дату.
        Возможны пересечения и неполнота региональных выборок.</div>
    </section>
    <section className="section-wrap">
      {!data?<div className="notice" role="alert">Не удалось получить предварительные сведения. Публичные карточки не затронуты.</div>
      :<>
        <p>Ожидают обработки: <strong>{data.total}</strong> наблюдений (не уникальных подтверждённых судов).
          {pages>0?' Страница '+data.page+' из '+pages+'.':''}</p>
        {data.items.length?<div className="editor-review-list">
          {data.items.map(item=><article key={item.discovery_id}>
            <div className="editor-review-title"><strong>{item.registry}</strong><span>№ {item.discovery_id}</span></div>
            <h2>{item.court_name}</h2>
            <p><strong>{item.court_kind}</strong></p>
            <dl className="court-facts">
              <div><dt>Регион</dt><dd>{item.region_name||'Не определён'}
                {item.region_code?' (код '+item.region_code+')':''}</dd></div>
              <div><dt>Классификационный код</dt><dd>{item.external_code||'Не установлен'}</dd></div>
              <div><dt>Адрес</dt><dd>{item.address||'Не подтверждён'}</dd></div>
              <div><dt>Дата снимка</dt><dd>{item.captured_on}</dd></div>
            </dl>
            <div className="editor-review-source">
              {trustedSource(item.official_court_url)?<a href={trustedSource(item.official_court_url)!}
                target="_blank" rel="noopener noreferrer">Страница суда ↗</a>:<span>Нет проверенного URL суда</span>}
              {trustedSource(item.source_record_url)?<a href={trustedSource(item.source_record_url)!}
                target="_blank" rel="noopener noreferrer">Строка источника ↗</a>:<span>Источник требует проверки</span>}
              {trustedSource(item.list_source_url)?<a href={trustedSource(item.list_source_url)!}
                target="_blank" rel="noopener noreferrer">Исходный список ↗</a>:null}
            </div>
            <p className="court-source">Запись только для исследования.
              Не может быть опубликована напрямую без полного официального профиля, уникального кода и отдельного редакционного утверждения.</p>
          </article>)}
        </div>:<div className="empty-state">На этой странице наблюдений нет.</div>}
        {pages>1?<nav className="category-pagination" aria-label="Страницы предварительных записей">
          {data.page>1?<Link href={data.page===2?route:route+'?page='+(data.page-1)}>← Предыдущая</Link>:<span/>}
          <span>Страница {data.page} / {pages}</span>
          {data.page<pages?<Link href={route+'?page='+(data.page+1)}>Следующая →</Link>:<span/>}
        </nav>:null}
      </>}
    </section>
    <section className="callout">
      <div><h2>Следующий шаг для каждой записи</h2>
        <p>Сверить действующий суд, актуальный уникальный идентификатор, контакты и URL с официальным первоисточником. Только затем — постановка полноценной карточки на редакционную приёмку.</p></div>
      <Link href="/editor/dashboard" className="button button-outline">Кабинет редактора →</Link>
    </section>
  </div>;
}
