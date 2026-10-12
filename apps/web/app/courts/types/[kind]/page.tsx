import Link from 'next/link';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {findCategory,COURT_CATEGORIES} from '../../../lib/court-taxonomy';
import {getCourtsByKind, type Court} from '../../../lib/api';

type Props={params:Promise<{kind:string}>};
export const dynamic='force-dynamic';
export function generateStaticParams(){return COURT_CATEGORIES.map(c=>({kind:c.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {kind}=await params,c=findCategory(kind);
 if(!c)return {title:'Вид суда не найден',robots:{index:false}};
 // Only index a category when actual verified court cards have been published.
 let populated=false;
 try{populated=(await getCourtsByKind(kind)).length>0;}catch{}
 return {title:c.title,description:c.description,robots:{index:populated,follow:true}};
}
export default async function KindPage({params}:Props){
 const {kind}=await params,c=findCategory(kind);
 if(!c)notFound();
 let courts:Court[]=[];let failed=false;
 try{courts=await getCourtsByKind(kind);}catch{failed=true;}
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды России</Link><span>/</span><Link href="/courts/types">Виды судов</Link><span>/</span>{c.short}</div>
  <section className="section-hero"><span className="kicker">Категория судебной системы</span><h1>{c.title}</h1>
  <p className="lead">{c.description}</p>
  <div className="notice"><span className="notice-dot" aria-hidden="true"/>Уровень: {c.level}. Это справочная классификация, а не вывод о подсудности конкретного дела.</div></section>
  <section className="section-wrap">
   <div className="section-intro"><span className="eyebrow">Проверенный реестр</span><h2>Суды этой категории</h2>
   <p>В списке появляются только записи с подтверждённым типом суда и редакционной проверкой данных.</p></div>
   {failed?<div role="alert" className="notice">Реестр временно недоступен. Проверьте позднее.</div>
    :courts.length?<div className="results">{courts.map(x=><Link key={x.id} className="result-row" href={'/courts/'+encodeURIComponent(x.region_slug??'')+'/'+encodeURIComponent(x.slug)}>
       <span><strong>{x.name}</strong><small>{x.region_name??''}{x.address?' · '+x.address:''}</small></span><span aria-hidden="true">↗</span>
     </Link>)}</div>
    :<div className="empty-state"><h3>Проверенные карточки пока не загружены</h3><p>Категория существует в классификаторе. Отсутствие записей в нашей базе не означает отсутствие таких судов.</p></div>}
  </section>
  <section className="callout"><div><span className="eyebrow">Проверка первоисточника</span><h2>Официальный справочник</h2>
  <p>Сведения о действующем суде, его составе и компетенции уточняйте на официальном ресурсе.</p></div>
  <div className="callout-links"><a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Официальный источник ↗</a>
  <Link href="/judges">Категории судей →</Link><Link href="/courts/types">Все виды судов →</Link></div></section>
 </>;
}
