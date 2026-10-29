import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {ConstitutionalDocumentGenerator} from '../../../../../_components/constitutional-document-generator';

type Props={params:Promise<{kind:string}>};
const base='/courts/reference/constitutional-court-rf';
const documents=[
 {kind:'complaint',title:'Генератор конституционной жалобы',lead:'Подготовьте структурированный проект индивидуальной жалобы гражданина в Конституционный Суд РФ.'},
 {kind:'fee-relief',title:'Генератор ходатайства по госпошлине',lead:'Подготовьте проект ходатайства об освобождении, уменьшении, отсрочке или рассрочке уплаты государственной пошлины.'}
] as const;

export const dynamic='force-dynamic';
export function generateStaticParams(){return documents.map(d=>({kind:d.kind}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const item=documents.find(x=>x.kind===(await params).kind);
 if(!item)return {title:'Документ не найден',robots:{index:false,follow:false}};
 return {title:item.title+' — Суды России',
  description:item.lead+' Справочный инструмент: требуется юридическая проверка перед подписанием.',
  robots:{index:false,follow:true}};
}
export default async function ConstitutionalDocumentPage({params}:Props){
 const kind=(await params).kind;
 const item=documents.find(d=>d.kind===kind);
 if(!item)notFound();
 return <article className="constitutional-reference-page">
  <nav className="breadcrumb" aria-label="Навигация">
   <Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды России</Link><span>/</span>
   <Link href={base}>Конституционный Суд РФ</Link><span>/</span>
   <Link href={base+'/info/complaint'}>Обращение в КС РФ</Link><span>/</span>{item.title}
  </nav>
  <section className="section-hero constitutional-reference-hero">
   <span className="kicker">Генератор документа · индивидуальное обращение</span>
   <h1>{item.title}</h1>
   <p className="lead">{item.lead}</p>
   <p className="constitutional-small">Инструмент рассчитан на гражданина, действующего лично. Для жалоб организаций, законного или профессионального представительства требуются отдельные проверки и документы. Проверка формы не подтверждает допустимость обращения.</p>
   <div className="court-filter-actions">
    <Link className="button button-outline" href={base}>← Карточка Конституционного Суда</Link>
    <Link className="button button-outline" href={base+'/info/complaint'}>Требования к обращению</Link>
   </div>
  </section>
  <section className="constitutional-block">
   <ConstitutionalDocumentGenerator kind={item.kind}/>
  </section>
  <section className="constitutional-block">
   <div className="section-intro"><span className="eyebrow">Следующий документ</span><h2>Связанные документы и инструкции</h2></div>
   <div className="constitutional-source-grid">
    <Link href={base+'/documents/complaint'}>Проект конституционной жалобы →</Link>
    <Link href={base+'/documents/fee-relief'}>Проект ходатайства по госпошлине →</Link>
    <Link href={base+'/info/payment'}>Правила оплаты и льготы →</Link>
    <Link href={base+'/info/reception'}>Куда направить документы →</Link>
   </div>
  </section>
 </article>;
}
