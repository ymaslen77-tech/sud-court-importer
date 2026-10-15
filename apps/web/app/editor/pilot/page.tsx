import Link from 'next/link';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {editorConfigured,hasEditorCredentials} from '../../lib/editor-auth';
import pilot from '../../lib/pilot-review-matrix.json';

export const dynamic='force-dynamic';
export const metadata:Metadata={
 title:'Пилотная редакционная десятка — закрытая проверка',
 robots:{index:false,follow:false}
};

function permittedSource(url:string):string|null {
 try {
  const value=new URL(url);
  const host=value.hostname.toLowerCase();
  if(value.protocol!=='https:'||value.username||value.password||value.port||
     !(host==='sudrf.ru'||host.endsWith('.sudrf.ru')))return null;
  return value.toString();
 }catch{return null;}
}

export default async function PilotReviewPage(){
 if(!editorConfigured()||!await hasEditorCredentials())notFound();
 return <div className="editor-desk">
  <div className="breadcrumb">
   <Link href="/editor/dashboard">Редакционный кабинет</Link><span>/</span>
   Пилот: 10 судов
  </div>
  <section className="section-hero">
   <span className="kicker">Закрытый рабочий список · без права публикации</span>
   <h1>Первые 10 судебных карточек</h1>
   <p className="lead">Индивидуальные официальные страницы, исходные значения и требования к редакционной проверке.</p>
   <div className="notice" role="status"><span className="notice-dot" aria-hidden="true"/>
    Дата исследовательского среза: {pilot.observed_on}.
    Доступные версии официальных страниц могут быть устаревшими.
    Ни одна запись в этом списке не прошла окончательную проверку.
   </div>
  </section>
  <section className="court-section">
   <h2>Обязательные условия допуска</h2>
   <p>Для каждого суда отдельно подтвердите идентификатор, актуальные контакты,
    точную компетенцию, допустимость использования сведений, источник и дату проверки.
    Данные из поискового кеша не являются новой редакционной аттестацией.</p>
   <p>Это статический исследовательский журнал, а не текущий статус Neon.
    Живое состояние следует сверять в <Link href="/editor/candidates">очереди кандидатов</Link>.
    На этой странице нет функции утверждения.</p>
  </section>
  <section className="court-section">
   <div className="editor-review-list">
   {pilot.records.map(item=><article key={item.external_code}>
    <div className="editor-review-title">
     <strong>{item.external_code}</strong><span>Исходный пакет № {item.batch_id}</span>
    </div>
    <h2>{item.court_name}</h2>
    <p><strong>Статус исследовательского досье:</strong> требует индивидуальной проверки.</p>
    <dl className="court-facts">
     <div><dt>Адрес из исходного реестра</dt><dd>{item.archived_values.address}</dd></div>
     <div><dt>Телефон из исходного реестра</dt><dd>{item.archived_values.phone}</dd></div>
     <div><dt>E-mail из исходного реестра</dt><dd>{item.archived_values.email}</dd></div>
     <div><dt>Идентификатор суда</dt><dd>Отдельно не подтверждён по текущему классификатору</dd></div>
     <div><dt>Подсудность</dt><dd>Нужна юридическая сверка</dd></div>
     <div><dt>Права использования</dt><dd>Решение не принято</dd></div>
     <div><dt>Актуальная редакционная проверка</dt><dd>Отсутствует</dd></div>
    </dl>
    {item.specific_blockers.length>0?<div>
      <strong>Особые замечания:</strong>
      <ul>{item.specific_blockers.map(note=><li key={note}>{note}</li>)}</ul>
    </div>:null}
    <p className="court-source">Источник исходной записи сохранён отдельно от индивидуального сайта,
      чтобы новый URL не выдавался за содержимое первоначального снимка.</p>
    <div className="editor-review-source">
     {permittedSource(item.individual_source_url)?<a
       href={permittedSource(item.individual_source_url)!} target="_blank"
       rel="noopener noreferrer">Индивидуальная официальная страница ↗</a>:null}
     <Link href={'/courts/region-'+item.region_code+'/sud-'+item.external_code.toLowerCase()}>
      Исследовательская карточка ↗
     </Link>
    </div>
   </article>)}
   </div>
  </section>
  <section className="callout"><div><h2>Публикация заблокирована</h2>
   <p>Редактор принимает решение по каждой записи отдельно. Проверка общего перечня или
     название на официальной странице не позволяют автоматически утверждать код суда,
     судей, уличные границы подсудности или банковские реквизиты.</p></div>
   <Link href="/editor/candidates" className="button button-outline">Текущая очередь Neon →</Link>
  </section>
 </div>;
}
