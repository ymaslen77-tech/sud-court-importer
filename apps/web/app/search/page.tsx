import Link from 'next/link';
import type {Metadata} from 'next';
import {CourtDirectoryExplorer} from '../_components/court-directory-explorer';
import {directoryEntries} from '../lib/court-directory';
import {DIRECTORY_REGIONS} from '../lib/directory-regions';
import {COURT_KINDS,findCategory} from '../lib/court-taxonomy';
import {getCourtsByKind,getRegionCourtsPage,searchCourts,verifiedBackendConfigured,type Court} from '../lib/api';

export const metadata:Metadata={
 title:'Найти суд России по региону, виду, названию и коду',
 description:'Поиск по московским, региональным и арбитражным перечням с указанием статуса проверки источника.',
 robots:{index:false,follow:true}
};
type Props={searchParams:Promise<{q?:string|string[];kind?:string|string[];region?:string|string[]}>};
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
 let verified:Court[]=[];
 let totalVerified=0,failed=false,partial=false;
 // A verified API is independent of the research/name-only browser index.
 // For combined filters, inspect each fetched category page; never use only
 // page 1 as a completeness test for a court's kind.
 if(verifiedBackendConfigured&&hasAny&&!notValid){
  try{
   if(q){
    verified=await searchCourts(q);
    if(region)verified=verified.filter(c=>c.region_slug===region);
    if(kind){
     const ids=new Set<string>();
     const first=await getCourtsByKind(kind,1);
     first.items.forEach(c=>ids.add(c.id));
     const totalPages=Math.ceil(first.total/Math.max(1,first.pageSize));
     for(let i=2;i<=Math.min(100,totalPages);i++){
      const next=await getCourtsByKind(kind,i);
      next.items.forEach(c=>ids.add(c.id));
     }
     partial=totalPages>100;
     verified=verified.filter(c=>ids.has(c.id));
    }
    totalVerified=verified.length;
   }else if(kind){
    const first=await getCourtsByKind(kind,1);
    if(region){
     const accumulated=[...first.items];
     const totalPages=Math.ceil(first.total/Math.max(1,first.pageSize));
     for(let i=2;i<=Math.min(100,totalPages);i++){
      accumulated.push(...(await getCourtsByKind(kind,i)).items);
     }
     partial=totalPages>100;
     verified=accumulated.filter(c=>c.region_slug===region);
     totalVerified=verified.length;
    }else{verified=first.items;totalVerified=first.total;partial=first.total>first.items.length;}
   }else if(region){
    const page=await getRegionCourtsPage(region,1);
    verified=page.items;totalVerified=page.total;partial=page.total>page.items.length;
   }
  }catch{failed=true;}
 }
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
    verified.length?<><p>Показано {verified.length} из {totalVerified} записей, соответствующих условиям.
     {partial?' Большой реестр может требовать дополнительной фильтрации через региональную страницу.':''}</p>
     <div className="results">{verified.map(c=><Link key={c.id} className="result-row" href={'/courts/'+encodeURIComponent(c.region_slug||region)+'/'+encodeURIComponent(c.slug)}>
      <span><strong>{c.name}</strong><small>{c.region_name||''} · {c.address||'Адрес уточняется'}</small>
      <small>Редакционная проверка: {c.verified_at}</small></span><span aria-hidden="true">↗</span>
     </Link>)}</div></>:
    <div className="empty-state">В подтверждённом API пока нет записей по заданным параметрам.</div>}
    {partial&&kind?<p><Link className="text-link" href={'/courts/types/'+kind}>Открыть полный подтверждённый список этого вида →</Link></p>:null}
  </section>:null}
  <section className="callout"><div>
   <span className="eyebrow">Адрес и подсудность</span>
   <h2>Нужно определить компетентный суд по адресу?</h2>
   <p>Совпадение названия города или адреса здания не определяет процессуальную подсудность. Учитывайте вид спора, адрес ответчика и специальные правила.</p>
  </div><Link className="button button-outline" href="/jurisdiction">Перейти к правилам подсудности →</Link></section>
 </>;
}
