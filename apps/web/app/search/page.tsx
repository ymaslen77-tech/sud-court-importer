import Link from 'next/link';
import type {Metadata} from 'next';
import {CourtSearch} from '../_components/court-search';
import {getCourtsByKind,getRegionCourtsPage,searchCourts,type Court} from '../lib/api';
import {COURT_KINDS,findCategory} from '../lib/court-taxonomy';
import {researchCourtsByKind,researchCourtsByRegion,researchRegions} from '../lib/research-courts';
import {pilotPublicCourts} from '../lib/pilot-public';
import {moscowCourts} from '../lib/moscow-courts';
import {findRegion} from '../lib/regions';
import {regionalArbitrationSearch,regionalArbitrationHref} from '../lib/regional-arbitration';

export const metadata:Metadata={title:'Поиск судов России по виду и региону',robots:{index:false,follow:true}};
type Props={searchParams:Promise<{q?:string|string[];kind?:string|string[];region?:string|string[]}>};
function textValue(value:string|string[]|undefined,max:number):string{
 return typeof value==='string'?value.trim().slice(0,max):'';
}
export default async function SearchPage({searchParams}:Props){
 const params=await searchParams;
 const q=textValue(params.q,101);
 const requestedKind=textValue(params.kind,80);
 const requestedRegion=textValue(params.region,40);
 const kind=COURT_KINDS.includes(requestedKind)?requestedKind:'';
 const region=findRegion(requestedRegion)?requestedRegion:'';
 const valid=(!q||q.length>=2)&&q.length<=100;
 const hasAny=Boolean(q||kind||region);
 const base=region?(region==='moscow'?[]:researchCourtsByRegion(region)):researchRegions().flatMap(r=>researchCourtsByRegion(r.slug));
 const moscow=(region===''||region==='moscow')&&(!kind||kind==='general-district')
   ?moscowCourts().filter(c=>!q||[c.name,c.address,c.slug].some(value=>
      value.toLocaleLowerCase('ru').replace(/ё/g,'е').includes(q.toLocaleLowerCase('ru').replace(/ё/g,'е'))))
   :[];
 const permittedKind=kind?new Set(researchCourtsByKind(kind).map(c=>c.code)):null;
 const research=valid&&hasAny?base.filter(c=>
   (!permittedKind||permittedKind.has(c.code))&&
   (!q||[c.name,c.address??'',c.regionName,c.code].some(value=>
       value.toLocaleLowerCase('ru').includes(q.toLocaleLowerCase('ru'))
   ))):[];
 const arbitration=valid&&hasAny?regionalArbitrationSearch(q,kind,region):[];
 const publishedCodes=new Set(pilotPublicCourts().map(x=>x.external_code));
 const sourcedPublic=research.filter(c=>publishedCodes.has(c.code));
 const researchOnly=research.filter(c=>!publishedCodes.has(c.code));
 let verified:Court[]=[];
 let failed=false;
 let totalVerified=0;
 if(valid&&hasAny){
   try{
     if(q){
       verified=await searchCourts(q);
       if(region)verified=verified.filter(c=>c.region_slug===region);
       if(kind){
         const permitted=await getCourtsByKind(kind,1);
         const ids=new Set(permitted.items.map(x=>x.id));
         verified=verified.filter(c=>ids.has(c.id));
       }
       totalVerified=verified.length;
     }else if(kind){
       const data=await getCourtsByKind(kind,1);
       verified=region?data.items.filter(c=>c.region_slug===region):data.items;
       totalVerified=region?verified.length:data.total;
     }else if(region){
       const data=await getRegionCourtsPage(region,1);
       verified=data.items;
       totalVerified=data.total;
     }
   }catch{failed=true;}
 }
 const label=[q?'«'+q+'»':null,kind?findCategory(kind)?.short:null,region?findRegion(region)?.name:null].filter(Boolean).join(' · ');
 return <>
  <div className="breadcrumb"><Link href="/">Главная</Link><span>/</span><Link href="/courts">Суды</Link><span>/</span>Поиск</div>
  <section className="section-hero">
    <span className="kicker">Расширенный поиск по каталогу</span>
    <h1>Найти суд</h1>
    <p className="lead">Выберите вид суда и регион в выпадающих списках. Название или классификационный код вводить необязательно.</p>
    <CourtSearch initialValue={q} initialKind={kind} initialRegion={region}/>
    {valid&&hasAny&&arbitration.length>0?<p className="notice" role="status">
      По выбранным условиям найдено судов в справочнике: <strong>{arbitration.length}</strong>.
      {' '}<a href="#arbitration-results">Перейти к найденному суду ↓</a>
    </p>:null}
  </section>
  <section className="section-wrap">
    <div className="section-intro">
      <span className="eyebrow">Подтверждённые сведения</span>
      <h2>{hasAny?'Результаты: '+label:'Начните поиск'}</h2>
    </div>
    {!hasAny?<p className="empty-state">Выберите регион, вид суда или введите его название.</p>
    :!valid?<p className="notice" role="alert">Текст запроса должен содержать от 2 до 100 символов.</p>
    :failed?<div role="alert" className="notice">Связь с подтверждённым реестром временно недоступна. Предварительные сведения показаны ниже отдельно.</div>
    :verified.length?<><p>Показано {verified.length} из {totalVerified} проверенных записей.</p>
      <div className="results">{verified.map(c=><Link className="result-row" key={c.id}
        href={'/courts/'+(c.region_slug??region)+'/'+c.slug}>
         <span><strong>{c.name}</strong><small>{c.region_name??''} {c.address?' · '+c.address:''}</small></span>
         <span aria-hidden="true">↗</span>
      </Link>)}</div></>
    :<div className="empty-state">В подтверждённой базе Neon пока нет полностью принятых карточек по этим условиям. {arbitration.length>0?'Ниже найден подходящий суд в справочном каталоге и указан источник его компетенции.':'Предварительные совпадения показаны ниже, если они доступны.'}</div>}
  </section>
  {valid&&hasAny&&moscow.length>0?<section className="section-wrap" aria-labelledby="moscow-matches">
   <div className="section-intro">
    <span className="eyebrow">Справочные карточки Москвы · официальный портал судов</span>
    <h2 id="moscow-matches">Суды Москвы: {moscow.length}</h2>
    <p>Двенадцать районных судов с отдельными досье. Источники указаны на страницах, актуальность отдельных сведений пока не аттестована.</p>
   </div>
   <div className="results">{moscow.map(c=><Link key={c.slug} className="result-row" href={'/courts/moscow/'+c.slug}>
    <span><strong>{c.name}</strong><small>Москва · Районный суд · {c.address}</small><small>Исследовательское досье по официальным источникам</small></span>
    <span aria-hidden="true">↗</span>
   </Link>)}</div>
  </section>:null}
  {valid&&hasAny&&arbitration.length>0?<section className="section-wrap" aria-labelledby="arbitration-results">
    <div className="section-intro">
      <span className="eyebrow">Арбитражные суды · исходный официальный список</span>
      <h2 id="arbitration-results">Найдены названия арбитражных судов: {arbitration.length}</h2>
      <p>Названия взяты из официального перечня. Для арбитражной кассации выбор региона учитывает территорию судебного округа согласно статье 24 ФКЗ № 1-ФКЗ — независимо от адреса суда. Для остальных записей контакты и составы могут быть не проверены.</p>
    </div>
    <div className="results">{arbitration.map(item=><Link key={item.slug} className="result-row"
      href={regionalArbitrationHref(region||item.regions[0],item.slug)}>
      <span><strong>{item.courtName}</strong>
        <small>{item.courtKind==='arbitration-district'?'Арбитражная кассация · судебный округ':item.courtKind==='arbitration-presence'?'Судебное присутствие':'Арбитражный суд субъекта'} · {item.jurisdictionLawUrl?'компетенция подтверждена законом':'предварительно'}</small>
      </span><span aria-hidden="true">↗</span>
    </Link>)}</div>
  </section>:null}
  {valid&&hasAny&&sourcedPublic.length>0?<section className="section-wrap" aria-labelledby="published-sourced">
    <div className="section-intro">
      <span className="eyebrow">Публичные справочные карточки по официальным источникам</span>
      <h2 id="published-sourced">Найдены подробные досье: {sourcedPublic.length}</h2>
      <p>Сведения опубликованы со ссылками на индивидуальные сайты судов и предупреждениями
       о необходимости перепроверки актуальности. Это не подтверждённые редакцией записи Neon.</p>
    </div>
    <div className="results">{sourcedPublic.map(c=><Link className="result-row" key={c.code}
      href={'/courts/'+c.region+'/sud-'+c.code.toLowerCase()}>
      <span><strong>{c.name}</strong><small>{c.regionName} · {c.kind} · {c.code}</small>
      <small>Публичная справочная карточка с источниками ↗</small></span><span aria-hidden="true">↗</span>
    </Link>)}</div>
  </section>:null}
  {valid&&hasAny?<section className="section-wrap" aria-labelledby="unreviewed-filters">
    <div className="section-intro">
      <span className="eyebrow">Исследовательский каталог — без редакционной приёмки</span>
      <h2 id="unreviewed-filters">Предварительные записи: {researchOnly.length}</h2>
      <p>Это результаты фильтрации открытых справочных списков, а не подтверждённый реестр. Предварительные записи доступны в трёх регионах; московская серия показана отдельно. Это не полный реестр судов России.</p>
    </div>
    {researchOnly.length?<div className="results">{researchOnly.slice(0,100).map(c=><Link className="result-row" key={c.code}
      href={'/courts/'+c.region+'/sud-'+c.code.toLowerCase()}>
      <span><strong>{c.name}</strong><small>{c.regionName} · {c.kind} · {c.code}</small>
       <small>Требует проверки актуальности и подсудности</small></span><span aria-hidden="true">↗</span>
    </Link>)}</div>:<div className="empty-state">В исследовательском списке тоже нет совпадений. Это не означает, что суд отсутствует.</div>}
    {researchOnly.length>100?<p className="court-source">Показаны первые 100 записей. Уточните регион или название.</p>:null}
  </section>:null}
  <section className="callout">
    <div><span className="eyebrow">Поиск по адресу</span>
      <h2>Как определить подсудность по адресу?</h2>
      <p>Для подбора по месту жительства заявителя, ответчика или месту недвижимости требуется учитывать категорию дела. Откройте отдельный поиск по адресу.</p>
    </div><Link className="button button-outline" href="/jurisdiction">Перейти к поиску подсудности →</Link>
  </section>
 </>;
}
