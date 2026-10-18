import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {moscowCourt,moscowCourts} from '../../../../../lib/moscow-courts';
import {adjudicatedCasesFor,adjudicatedCase,isVerifiedDocument} from '../../../../../lib/moscow-adjudicated-cases';
import {MOSCOW_CASE_TOPICS} from '../../../../../lib/moscow-case-topics';
import {isFullTextTopicEligible} from '../../../../../lib/moscow-adjudicated-cases';
type Params={params:Promise<{slug:string;caseId:string}>};
export const dynamicParams=false;
export function generateStaticParams(){
 return moscowCourts().map(c=>c.slug).flatMap(slug=>
  adjudicatedCasesFor(slug).map(c=>({slug,caseId:c.slug})));
}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const p=await params;const c=adjudicatedCase(p.slug,p.caseId);
 if(!c)return {title:'Дело не найдено',robots:{index:false,follow:false}};
 return {
  title:'Дело № '+c.number+' — решение '+c.decision_date,
  description:'Предмет: '+c.subject+'. Результат первой инстанции: '+c.disposition+'. Официальный источник и статус публикации судебного акта.',
  alternates:{canonical:'/courts/moscow/'+p.slug+'/cases/'+p.caseId},
  robots:{index:false,follow:true}
 };
}
export default async function CourtDecisionPage({params}:Params){
 const {slug,caseId}=await params;
 const court=moscowCourt(slug);const c=adjudicatedCase(slug,caseId);
 if(!court||!c)notFound();
 const topic=MOSCOW_CASE_TOPICS.find(t=>t.id===c.topic_id);
 const hasDocument=isVerifiedDocument(c);
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
   <Link href="/courts">Суды</Link><span>/</span><Link href="/courts/moscow">Москва</Link>
   <span>/</span><Link href={'/courts/moscow/'+slug}>{court.name}</Link><span>/</span>Дело № {c.number}</div>
  <section className="section-hero">
   <span className="kicker">Официально установленный результат · первая инстанция</span>
   <h1>Судебное дело № {c.number}</h1>
   <p className="lead">{c.subject}</p>
  </section>
  <section className="court-section">
   <h2>Карточка дела и результат рассмотрения</h2>
   <dl className="court-facts">
    <div><dt>Суд</dt><dd>{court.name}</dd></div>
    <div><dt>Категория права</dt><dd>{topic?.title??'Категория требует уточнения'}</dd></div>
    <div><dt>Номер дела</dt><dd>{c.number}</dd></div>
    <div><dt>Суть спора</dt><dd>{c.subject}</dd></div>
    <div><dt>Результат первой инстанции</dt><dd><strong>{c.disposition}</strong></dd></div>
    <div><dt>Дата решения</dt><dd>{c.decision_date}</dd></div>
    <div><dt>Источник</dt><dd><a href={c.source_url} target="_blank" rel="noopener noreferrer">Персональная карточка дела на официальном портале ↗</a></dd></div>
    <div><dt>Дата исследования</dt><dd>{c.researched_on}</dd></div>
   </dl>
   <p className="court-source">Сведения о результатах взяты из официальной карточки дела; текст мотивировки и доводы суда не пересказываются, если документ не проверен.</p>
  </section>
  <section className="court-section" id="decision-document">
   <h2>Судебный акт — документ</h2>
   {hasDocument&&c.published_document?
    <div className="court-decision-document">
     <p>Полный текст прошёл редакционную проверку и проверку обезличивания.</p>
     {c.published_document.kind==='pdf'?
      <iframe title={'Официальное решение по делу '+c.number} src={c.published_document.localPath} loading="lazy"/>:
      <a href={c.published_document.localPath} target="_blank" rel="noopener noreferrer">Открыть полный текст судебного акта ↗</a>}
     <p><a href={c.published_document.localPath} target="_blank" rel="noopener noreferrer">Открыть документ отдельно ↗</a></p>
    </div>:
    <div className="notice" role="note">
     <strong>Полный текст судебного акта пока не размещён на нашем сайте.</strong>
     <p>{!isFullTextTopicEligible(c.topic_id)?
      'Публикация полных текстов актов по семейно-правовым делам исключена статьёй 15 Федерального закона № 262-ФЗ. Доступны только допустимые обезличенные справочные сведения.':c.official_file_listed?
      'Официальная карточка указывает на наличие файла судебного акта. На нашем сайте текст пока не получен и не прошёл проверку, поэтому документ здесь не показывается.':c.document_status==='awaiting_official_publication'?
      'В официальной карточке найдено указание, что текст готовится к публикации. Полный документ нельзя предоставлять как опубликованный.':
      'Результат решения подтверждён, но файл судебного акта ещё не получен, не проверен или его повторное размещение не разрешено.'}</p>
     <p><a href={c.source_url} target="_blank" rel="noopener noreferrer">Проверить наличие полного судебного акта в официальной карточке дела ↗</a></p>
    </div>}
   <p className="court-source">Решение первой инстанции может быть обжаловано или изменено. Показанный результат не означает автоматическое вступление акта в законную силу.</p>
  </section>
  <section className="court-section">
   <h2>Другие дела и похожая практика</h2>
   <p>Категория: {topic?.title??'судебное производство'}. Мы не утверждаем, что это решение применимо к другому спору без анализа обстоятельств и редакции закона.</p>
   <Link className="text-link" href={'/courts/moscow/'+slug+'#msk-cases'}>Посмотреть все категории дел этого суда →</Link>
  </section>
 </>;
}
