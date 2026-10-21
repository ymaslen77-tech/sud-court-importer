import Link from 'next/link';
import type {Metadata} from 'next';
import {CourtDirectoryExplorer} from '../_components/court-directory-explorer';
import {directoryEntries} from '../lib/court-directory';
import {DIRECTORY_REGIONS} from '../lib/directory-regions';
import {COURT_KINDS} from '../lib/court-taxonomy';
import {searchVerifiedCourtsPage,verifiedBackendConfigured,type CourtCategoryResult} from '../lib/api';

export const metadata:Metadata={
 title:'Найти суд России по региону, виду, названию и коду',
 description:'Поиск по московским, региональным и арбитражным перечням с указанием статуса проверки источника.',
 robots:{index:false,follow:true}
};
type Props={searchParams:Promise<{q?:string|string[];kind?:string|string[];region?:string|string[];verifiedPage?:string|string[]}>};
function textValue(value:string|string[]|undefined,max:number):string{
 return typeof value==='string'?value.trim().slice(0,max):'';
}
export default async function SearchPage({searchParams}:Props){
 const params=await searchParams;
 const rawQuery=textValue(params.q,101);
 const requestedKind=textValue(params.kind,80);
 const requestedRegion=textValue(params.region,40);
 const kind=COURT_KINDS.includes(requestedKind)?requestedKind:'';
 const region=DIRECTORY_REGIONS.some(x=>x.slug===requestedRegion)?requestedRegion:'';
 const q=rawQuery.length<=100?rawQuery:'';
 const notValid=Boolean(rawQuery&&(!q||q.length<2));
 const hasAny=Boolean(q||kind||region);
 const p=textValue(params.verifiedPage,5);
 const verifiedPage=/^[1-9][0-9]{0,3}$/.test(p)?Number(p):1;
 let result:CourtCategoryResult={items:[],total:0,page:verifiedPage,pageSize:50};
 let failed=false;
 if(verifiedBackendConfigured&&hasAny&&!notValid){
  try{
   result=await searchVerifiedCourtsPage({q,kind,region,page:verifiedPage});
  }catch{failed=true;}
 }
 const pages=Math.max(1,Math.ceil(result.total/Math.max(1,result.pageSize)));
 const verifiedLink=(page:number)=>{
  const query=new URLSearchParams();
  if(q)query.set('q',q);
  if(kind)query.set('kind',kind);
  if(region)query.set('region',region);
  query.set('verifiedPage',String(page));
  return '/search?'+query.toString();
 };
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды России</Link><span>/</span>Поиск</div>
  <section className="section-hero">
   <span className="kicker">Общий справочник и официальные источники</span>
   <h1>Найти суд</h1>
   <p className="lead">Единый поиск по предварительным карточкам Москвы, других регионов и названиям арбитражных судов.</p>
  </section>
  <section className="section-wrap">
   {notValid?<div className="notice" role="alert">Для поиска по названию введите 2–100 символов.</div>:null}
   <CourtDirectoryExplorer entries={directoryEntries()} initialValue={q}
    initialKind={kind} initialRegion={region}/>
  </section>
  {verifiedBackendConfigured&&hasAny&&!notValid?<section className="section-wrap" aria-label="Редакционно подтверждённый реестр">
   <div className="section-intro">
    <span className="eyebrow">Отдельный подтверждённый реестр API</span>
    <h2>Проверенные редакцией карточки</h2>
   </div>
   {failed?<div role="alert" className="notice">Подтверждённый реестр временно недоступен; сведения в общем поиске выше остаются предварительными.</div>:
    result.items.length?<><p>Найдено {result.total} проверенных карточек. Страница {result.page} из {pages}.</p>
     <div className="results">{result.items.map(c=><Link key={c.id} className="result-row" href={'/courts/'+encodeURIComponent(c.region_slug||region)+'/'+encodeURIComponent(c.slug)}>
      <span><strong>{c.name}</strong><small>{c.region_name||''} · {c.address||'Адрес уточняется'}</small>
      <small>Редакционная проверка: {c.verified_at}</small></span><span aria-hidden="true">↗</span>
     </Link>)}</div>
     {pages>1?<nav className="category-pagination" aria-label="Страницы подтверждённого реестра">
      {result.page>1?<Link href={verifiedLink(result.page-1)}>← Предыдущая</Link>:<span/>}
      <span>Страница {result.page} из {pages}</span>
      {result.page<pages?<Link href={verifiedLink(result.page+1)}>Следующая →</Link>:<span/>}
     </nav>:null}
    </>:<div className="empty-state">В подтверждённом API пока нет записей по заданным параметрам.</div>}
  </section>:null}
  <section className="callout"><div>
   <span className="eyebrow">Адрес и подсудность</span>
   <h2>Нужно определить компетентный суд по адресу?</h2>
   <p>Совпадение названия города или адреса здания не определяет процессуальную подсудность. Учитывайте вид спора, адрес ответчика и специальные правила.</p>
  </div><Link className="button button-outline" href="/jurisdiction">Перейти к правилам подсудности →</Link></section>
 </>;
}
