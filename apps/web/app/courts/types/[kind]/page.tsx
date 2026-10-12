import Link from 'next/link';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {findCategory,COURT_CATEGORIES} from '../../../lib/court-taxonomy';
import {getCourtsByKind, type CourtCategoryResult} from '../../../lib/api';

type Props={params:Promise<{kind:string}>;searchParams:Promise<{page?:string|string[]}>};
export const dynamic='force-dynamic';
export function generateStaticParams(){return COURT_CATEGORIES.map(c=>({kind:c.slug}));}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
 const {kind}=await params,c=findCategory(kind);
 if(!c)return {title:'Вид суда не найден',robots:{index:false}};
 const q=await searchParams;
 // Only index the first category page once it has reviewed court entries.
 let populated=false;
 try{populated=(await getCourtsByKind(kind,1)).total>0;}catch{}
 return {title:c.title,description:c.description,robots:{index:populated&&!q.page,follow:true}};
}
export default async function KindPage({params,searchParams}:Props){
 const {kind}=await params,c=findCategory(kind);
 if(!c)notFound();
 const q=await searchParams;
 const rawPage=typeof q.page==='string'?q.page:'1';
 const requested=/^[1-9][0-9]{0,3}$/.test(rawPage)?Number(rawPage):1;
 let result:CourtCategoryResult={items:[],total:0,page:requested,pageSize:50};
 let failed=false;
 try{result=await getCourtsByKind(kind,requested);}catch{failed=true;}
 const pages=Math.ceil(result.total/result.pageSize);
 const base='/courts/types/'+c.slug;
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span><Link href="/courts/types">Виды судов</Link><span>/</span>{c.short}</div>
  <section className="section-hero"><span className="kicker">Категория судебной системы</span><h1>{c.title}</h1>
  <p className="lead">{c.description}</p>
  <div className="notice"><span className="notice-dot" aria-hidden="true"/>Уровень: {c.level}. Это справочная классификация, а не вывод о подсудности конкретного дела.</div></section>
  <section className="section-wrap">
   <div className="section-intro"><span className="eyebrow">Проверенный реестр</span><h2>Суды этой категории</h2>
   <p>В списке появляются только записи с подтверждённым типом суда и редакционной проверкой данных.</p>
   {!failed&&result.total>0?<p>Опубликовано подтверждённых карточек в категории: <strong>{result.total}</strong>. Страница {result.page} из {pages}.</p>:null}</div>
   {failed?<div role="alert" className="notice">Реестр временно недоступен. Проверьте позднее.</div>
    :result.items.length?<div className="results">{result.items.map(x=><Link key={x.id} className="result-row" href={'/courts/'+encodeURIComponent(x.region_slug)+'/'+encodeURIComponent(x.slug)}>
       <span><strong>{x.name}</strong><small>{x.region_name}{x.address?' · '+x.address:''}</small></span><span aria-hidden="true">↗</span>
     </Link>)}</div>
    :<div className="empty-state"><h3>{result.total>0?'На этой странице записей нет':'Проверенные карточки пока не загружены'}</h3>
      <p>Категория существует в классификаторе. Отсутствие записей в нашей базе не означает отсутствие таких судов.</p></div>}
   {!failed&&pages>1?<nav className="category-pagination" aria-label="Страницы списка судов">
     {result.page>1?<Link href={result.page===2?base:base+'?page='+(result.page-1)}>← Предыдущая</Link>:<span/>}
     <span>Страница {result.page} / {pages}</span>
     {result.page<pages?<Link href={base+'?page='+(result.page+1)}>Следующая →</Link>:<span/>}
   </nav>:null}
  </section>
  <section className="callout"><div><span className="eyebrow">Проверка первоисточника</span><h2>Официальный справочник</h2>
  <p>Сведения о действующем суде, его составе и компетенции уточняйте на официальном ресурсе.</p></div>
  <div className="callout-links"><a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Официальный источник ↗</a>
  <Link href="/judges">Категории судей →</Link><Link href="/courts/types">Все виды судов →</Link></div></section>
 </>;
}