import Link from 'next/link';
import type {Metadata} from 'next';
import {getRegionCourtsPage,getRegions,type RegionCourtPage} from '../../lib/api';
import {researchCourtsByRegion} from '../../lib/research-courts';
import {pilotPublicCourts} from '../../lib/pilot-public';
import {findRegion} from '../../lib/regions';
import {regionalArbitrationCourts,regionalArbitrationHref} from '../../lib/regional-arbitration';
import {pushkinskyCourt} from '../../lib/court-rich-records';
import {OFFICIAL_REFERENCE_COURTS} from '../../lib/official-reference-courts';

type Props = {
  params:Promise<{region:string}>;
  searchParams:Promise<{page?:string|string[]}>;
};
export const dynamic='force-dynamic';

function selectPage(raw:string|string[]|undefined){
  return typeof raw==='string'&&/^[1-9][0-9]{0,3}$/.test(raw)?Number(raw):1;
}
function regionName(slug:string,regions:Awaited<ReturnType<typeof getRegions>>){
  return regions.find(r=>r.slug===slug)?.name??(findRegion(slug)?.name??slug);
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
      robots:{index:result.items.length>0 || pilotPublicCourts().some(x=>'region-'+x.region_code===region),follow:true}
    };
  }catch{
    return {title:'Каталог судов',robots:{index:false,follow:true}};
  }
}

export default async function RegionPage({params,searchParams}:Props){
  const [{region},query]=await Promise.all([params,searchParams]);
  const page=selectPage(query.page);
  let result:RegionCourtPage={items:[],total:0,page,pageSize:50};
  let label=findRegion(region)?.name??region;
  const pilot=pilotPublicCourts().filter(x=>'region-'+x.region_code===region);
  const arbitration=regionalArbitrationCourts(region);
  const officialReferences=OFFICIAL_REFERENCE_COURTS.filter(c=>c.region===region);
  const codes=new Set(pilot.map(x=>x.external_code));
  const candidates=researchCourtsByRegion(region).filter(x=>!codes.has(x.code));
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
    {officialReferences.length>0?<section className="section-wrap" aria-labelledby="official-regional-references">
      <div className="section-intro">
        <span className="eyebrow">Контакты по официальным судебным источникам</span>
        <h2 id="official-regional-references">Суды с адресами и отдельными карточками: {officialReferences.length}</h2>
        <p>Для этих судов опубликованы адрес, телефон, электронная почта, карта и прямые ссылки на официальные сервисы дел. Актуальность и состав судей требуют отдельной редакционной проверки.</p>
      </div>
      <div className="results">{officialReferences.map(c=>
        <Link className="result-row" key={c.slug} href={'/courts/reference/'+c.slug}>
          <span><strong>{c.name}</strong><small>{c.address} · {c.phone}</small><small>Официальный первоисточник · справочная карточка</small></span>
          <span aria-hidden="true">↗</span>
        </Link>
      )}</div>
    </section>:null}
    {pilot.length>0?<section className="section-wrap" aria-labelledby="partial-pilot">
      <div className="section-intro">
        <span className="eyebrow">Официальные опубликованные сведения · уточнение актуальности</span>
        <h2 id="partial-pilot">Подробные справочные карточки: {pilot.length}</h2>
        <p>Эти карточки показывают изученные официальные публикации, но не являются полностью
         верифицированными записями реестра. Проверяйте контакты перед визитом.</p>
      </div>
      <div className="results">{pilot.map(item=><Link className="result-row" key={item.external_code}
        href={base+'/sud-'+item.external_code.toLowerCase()}>
        <span><strong>{item.official_header_court_name}</strong>
          <small>{item.external_code} · {item.archived_values.address}</small></span>
        <span aria-hidden="true">↗</span>
      </Link>)}</div>
    </section>:null}
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
    {region===pushkinskyCourt.region?<section className="section-wrap" aria-labelledby="official-dossier-pushkinsky">
      <div className="section-intro">
       <span className="eyebrow">Структурированное досье по официальным публикациям</span>
       <h2 id="official-dossier-pushkinsky">Пушкинский городской суд</h2>
       <p>Подробная карточка: два здания, подразделения, опубликованный состав судей с указами назначения,
       связь с мировыми участками, официальные процессуальные сервисы и статус проверки каждого блока.</p>
      </div>
      <div className="results"><Link className="result-row"
        href={'/courts/'+pushkinskyCourt.region+'/'+pushkinskyCourt.slug}>
        <span><strong>{pushkinskyCourt.name}</strong><small>Расширенная карточка · источник: ГАС «Правосудие»</small></span>
        <span aria-hidden="true">↗</span>
      </Link></div>
    </section>:null}
    {arbitration.length>0?<section className="section-wrap" aria-labelledby="regional-arbitration">
      <div className="section-intro">
        <span className="eyebrow">Исходный список арбитражных судов · ещё не проверен</span>
        <h2 id="regional-arbitration">Арбитражные суды по территории региона: {arbitration.length}</h2>
        <p>Названия перенесены из ранее сохранённого перечня официального арбитражного портала.
        Для кассационных судов учтена территориальная компетенция по статье 24 ФКЗ № 1-ФКЗ. Адреса, судьи и дела в общем случае ещё не проверены.</p>
      </div>
      <div className="results">{arbitration.map(item=><Link key={item.slug} className="result-row"
        href={regionalArbitrationHref(region,item.slug)}>
        <span><strong>{item.courtName}</strong>
          <small>{item.courtKind==='arbitration-district'?'Арбитражная кассация · судебный округ':item.courtKind==='arbitration-presence'?'Постоянное судебное присутствие':'Арбитражный суд субъекта'} · {item.jurisdictionLawUrl?'юрисдикция установлена законом':'сведения требуют проверки'}</small>
        </span><span aria-hidden="true">↗</span>
      </Link>)}</div>
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
