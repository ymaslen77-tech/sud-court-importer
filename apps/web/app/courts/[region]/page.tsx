import Link from 'next/link';
import type {Metadata} from 'next';
import {getRegionCourtsPage,getRegions,type RegionCourtPage} from '../../lib/api';
import {researchCourtsByRegion} from '../../lib/research-courts';

type Props = {
  params:Promise<{region:string}>;
  searchParams:Promise<{page?:string|string[]}>;
};
export const dynamic='force-dynamic';

function selectPage(raw:string|string[]|undefined){
  return typeof raw==='string'&&/^[1-9][0-9]{0,3}$/.test(raw)?Number(raw):1;
}
function regionName(slug:string,regions:Awaited<ReturnType<typeof getRegions>>){
  return regions.find(r=>r.slug===slug)?.name??(slug==='moscow'?'Москва':slug);
}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
  const [{region},query]=await Promise.all([params,searchParams]);
  const page=selectPage(query.page);
  const canonical='/courts/'+encodeURIComponent(region)+(page>1?'?page='+page:'');
  try{
    const [result,regions]=await Promise.all([getRegionCourtsPage(region,page),getRegions()]);
    const label=regionName(region,regions);
    return {
      title:'Суды: '+label+(page>1?' — страница '+page:''),
      description:'Каталог проверенных судов региона '+label+'. Адреса, телефоны, официальные сайты и судебные карточки.',
      alternates:{canonical},
      robots:{index:result.items.length>0,follow:true}
    };
  }catch{
    return {title:'Каталог судов',robots:{index:false,follow:true}};
  }
}

export default async function RegionPage({params,searchParams}:Props){
  const [{region},query]=await Promise.all([params,searchParams]);
  const page=selectPage(query.page);
  let result:RegionCourtPage={items:[],total:0,page,pageSize:50};
  let label=region==='moscow'?'Москва':region;
  const candidates=researchCourtsByRegion(region);
  if(candidates.length)label=candidates[0].regionName;
  let failed=false;
  try{
    const [found,regions]=await Promise.all([getRegionCourtsPage(region,page),getRegions()]);
    result=found;
    label=regions.find(r=>r.slug===region)?.name??candidates[0]?.regionName??regionName(region,regions);
  }catch{failed=true;}
  const totalPages=Math.ceil(result.total/result.pageSize);
  const base='/courts/'+encodeURIComponent(region);
  return <>
    <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span>
      <Link href="/courts">Суды России</Link><span>/</span>{label}</div>
    <section className="section-hero">
      <span className="kicker">Региональный каталог</span>
      <h1>Суды: {label}</h1>
      <p className="lead">Суды региона с индивидуальными карточками, контактами, сведениями о судьях и ссылками на проверенные первоисточники.</p>
      <p className="court-source">Каталог содержит только подтверждённые и разрешённые к публикации записи, а не все предварительно собранные названия.</p>
    </section>
    <section className="section-wrap">
      <div className="section-intro">
        <span className="eyebrow">Реестр региона</span>
        <h2>Список судов</h2>
        {!failed&&result.total>0?<p>
          Опубликовано карточек: <strong>{result.total}</strong>.
          Страница {result.page} из {totalPages}.
        </p>:null}
      </div>
      {failed?<div role="alert" className="notice">Данные сейчас недоступны. Попробуйте позже.</div>
       :result.items.length?<div className="results">{result.items.map(c=>
         <Link key={c.id} className="result-row" href={base+'/'+encodeURIComponent(c.slug)}>
           <span><strong>{c.name}</strong>
             <small>{c.court_type}{c.address?' · '+c.address:''}</small>
           </span><span aria-hidden="true">↗</span>
         </Link>
       )}</div>
       :<div className="empty-state"><h3>{result.total>0?'На этой странице судов нет':'Подтверждённых карточек пока нет'}</h3>
         <p>Отсутствие опубликованной записи не означает, что суд не существует. Данные появятся только после проверки.</p>
         <Link className="text-link" href="/sources">Принципы публикации →</Link>
       </div>}
      {!failed&&totalPages>1?<nav className="category-pagination" aria-label="Страницы регионального списка">
        {result.page>1?<Link href={result.page===2?base:base+'?page='+(result.page-1)}>← Предыдущая</Link>:<span/>}
        <span>Страница {result.page} / {totalPages}</span>
        {result.page<totalPages?<Link href={base+'?page='+(result.page+1)}>Следующая →</Link>:<span/>}
      </nav>:null}
    </section>
    {candidates.length>0?<section className="section-wrap" aria-labelledby="research-courts">
      <div className="section-intro">
        <span className="eyebrow">Отдельно от опубликованного реестра</span>
        <h2 id="research-courts">Суды из открытого официального перечня: {candidates.length}</h2>
        <p>Ниже — предварительные записи. Они не считаются подтверждёнными судами нашего каталога, не входят в счётчик опубликованных карточек и закрыты от поисковой индексации до редакционной сверки.</p>
      </div>
      <div className="results">
        {candidates.map(candidate=><Link key={candidate.code} className="result-row"
          href={'/courts/'+encodeURIComponent(region)+'/sud-'+candidate.code.toLowerCase()}>
          <span><strong>{candidate.name}</strong>
            <small>{candidate.code} · {candidate.address}</small>
            <small>Источник: ГАС «Правосудие» · требуется проверка актуальности</small>
          </span><span aria-hidden="true">↗</span>
        </Link>)}
      </div>
    </section>:null}
    <section className="callout">
      <div><span className="eyebrow">Дополнительная проверка</span>
        <h2>Где искать сведения, которых ещё нет в каталоге?</h2>
        <p>Используйте официальный ресурс судебной системы для контактов и отдельный независимый каталог судебных актов для исследования практики.</p></div>
      <div className="callout-links">
        <a href="https://sudrf.ru/" target="_blank" rel="noopener noreferrer">ГАС «Правосудие» ↗</a>
        <a href="https://sudact.ru/regular/area/" target="_blank" rel="noopener noreferrer">СудАкт · справочный каталог ↗</a>
        <Link href="/courts">Все регионы →</Link>
      </div>
    </section>
  </>;
}
