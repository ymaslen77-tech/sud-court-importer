import Link from 'next/link';
import type {Metadata} from 'next';
import {CourtSearch} from '../_components/court-search';
import {getCourtsByKind,getRegionCourtsPage,searchCourts,type Court} from '../lib/api';
import {COURT_KINDS,findCategory} from '../lib/court-taxonomy';
import {researchCourtsByKind,researchCourtsByRegion,researchRegions} from '../lib/research-courts';
import {pilotPublicCourts} from '../lib/pilot-public';
import {moscowCourts} from '../lib/moscow-courts';
import {MOSCOW_OFFICIAL_MINIMUM_COURTS,MoscowOfficialCourtHref} from '../lib/moscow-official-minimum';
import {findRegion} from '../lib/regions';
import {regionalArbitrationSearch,regionalArbitrationHref} from '../lib/regional-arbitration';
import {pushkinskyCourt} from '../lib/court-rich-records';
import {officialReferenceMatches,officialReferenceCourt} from '../lib/official-reference-courts';

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
 // Use the complete official list, not only the twelve manually researched dossiers.
 // MoscowOfficialCourtHref resolves those twelve to their existing detailed pages.
 const moscow=(region===''||region==='moscow')&&
   (!kind||kind==='general-district'||kind==='general-regional')
   ?MOSCOW_OFFICIAL_MINIMUM_COURTS.filter(c=>
     (!kind||(kind===c.kind))&&
     (!q||[c.name,c.address,c.slug,c.directory_code??'',c.email].some(value=>
       value.toLocaleLowerCase('ru').replace(/ё/g,'е')
         .includes(q.toLocaleLowerCase('ru').replace(/ё/g,'е')))))
   :[];
 const permittedKind=kind?new Set(researchCourtsByKind(kind).map(c=>c.code)):null;
 const research=valid&&hasAny?base.filter(c=>
   (!permittedKind||permittedKind.has(c.code))&&
   (!q||[c.name,c.address??'',c.regionName,c.code].some(value=>
       value.toLocaleLowerCase('ru').includes(q.toLocaleLowerCase('ru'))
   ))):[];
 const arbitration=valid&&hasAny?regionalArbitrationSearch(q,kind,region):[];
 const pushkinskyMatch=valid&&hasAny&&(!kind||kind==='general-district')
   &&(!region||region===pushkinskyCourt.region)
   &&(!q||[pushkinskyCourt.name,...pushkinskyCourt.addresses.map(a=>a.value)]
      .some(value=>value.toLocaleLowerCase('ru').replace(/ё/g,'е')
        .includes(q.toLocaleLowerCase('ru').replace(/ё/g,'е'))));
 const publishedCodes=new Set(pilotPublicCourts().map(x=>x.external_code));
 const sourcedPublic=research.filter(c=>publishedCodes.has(c.code));
 const researchOnly=research.filter(c=>!publishedCodes.has(c.code));
 const official=valid&&hasAny?officialReferenceMatches(q,kind,region):[];
 const constitutionalRegionConflict=valid&&kind==='constitutional'&&Boolean(region);
 const constitutionalCourt=officialReferenceCourt('constitutional-court-rf');
 const researchKindAllowed=(!kind||!kind.startsWith('arbitration-'))&&kind!=='constitutional'&&kind!=='supreme';
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
      {' '}{arbitration.length===1
        ?<Link href={regionalArbitrationHref(region||arbitration[0].regions[0],arbitration[0].slug)}>{arbitration[0].courtName} →</Link>
        :<a href="#arbitration-results">Посмотреть список судов ↓</a>}
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
    :constitutionalRegionConflict?<div className="empty-state" role="status">
       <h3>В выбранном регионе нет суда этой категории</h3>
       <p>Конституционный Суд РФ — федеральный орган конституционного контроля, а не суд субъекта РФ. Конституционные (уставные) суды субъектов были упразднены к 1 января 2023 года. Ниже — карточка действующего Конституционного Суда РФ и переход к судам выбранного региона.</p>
     </div>
    :verified.length?<><p>Показано {verified.length} из {totalVerified} проверенных записей.</p>
      <div className="results">{verified.map(c=><Link className="result-row" key={c.id}
        href={'/courts/'+(c.region_slug??region)+'/'+c.slug}>
         <span><strong>{c.name}</strong><small>{c.region_name??''} {c.address?' · '+c.address:''}</small></span>
         <span aria-hidden="true">↗</span>
      </Link>)}</div></>
    :<div className="empty-state">В редакционно проверенной базе проекта пока нет полностью принятых карточек по этим условиям. {official.length>0?'Ниже представлены суды с адресами из официальных источников — их реквизиты необходимо перепроверять перед обращением.':arbitration.length>0?'Ниже найден подходящий суд в официальном справочном каталоге.':'Предварительные совпадения показаны ниже, если они доступны.'}</div>}
  </section>
  {constitutionalRegionConflict&&constitutionalCourt?<section className="section-wrap" aria-labelledby="constitutional-scope">
    <div className="section-intro">
      <span className="eyebrow">Федеральный суд · не относится к субъекту РФ</span>
      <h2 id="constitutional-scope">{constitutionalCourt.name}</h2>
      <p>Адрес: {constitutionalCourt.address}. Конституционное судопроизводство не распределяется по региональным конституционным судам.</p>
    </div>
    <div className="results">
      <Link className="result-row" href={'/courts/reference/'+constitutionalCourt.slug}>
        <span><strong>{constitutionalCourt.name}</strong><small>{constitutionalCourt.address}</small><small>Телефон: {constitutionalCourt.phone} · официальная справочная карточка</small></span><span aria-hidden="true">↗</span>
      </Link>
    </div>
    <div className="court-filter-actions">
      <Link className="text-link" href={'/courts/'+region}>Открыть суды региона {findRegion(region)?.name} →</Link>
      <Link className="text-link" href={'/search?region='+encodeURIComponent(region)+'&kind=general-regional'}>Краевые, областные и приравненные суды →</Link>
      <Link className="text-link" href={'/search?region='+encodeURIComponent(region)+'&kind=general-district'}>Районные и городские суды →</Link>
      <a className="text-link" href="https://www.consultant.ru/document/cons_doc_LAW_56550/66b0b03f24f6fa0319387bf92a3536b37f1c90bb/" target="_blank" rel="noopener noreferrer">Правовое основание упразднения региональных конституционных судов ↗</a>
    </div>
  </section>:null}
  {official.length>0?<section className="section-wrap" aria-labelledby="official-source-matches">
    <div className="section-intro">
      <span className="eyebrow">Справочные карточки по официальным судебным публикациям</span>
      <h2 id="official-source-matches">Найдены суды с адресами: {official.length}</h2>
      <p>Показана первая партия карточек с адресами, телефонами, картами и прямыми ссылками на официальный поиск судебных дел. Редакционная приёмка записей и индивидуальная сверка состава судей ещё не завершены.</p>
    </div>
    <div className="results">{official.map(c=><Link className="result-row" key={c.slug} href={'/courts/reference/'+c.slug}>
      <span><strong>{c.name}</strong><small>{c.regionName} · {c.address}</small><small>{c.phone} · {findCategory(c.kind)?.short} · официальный источник</small></span>
      <span aria-hidden="true">↗</span>
    </Link>)}</div>
  </section>:null}
  {pushkinskyMatch?<section className="section-wrap" aria-labelledby="pushkinsky-result">
    <div className="section-intro">
      <span className="eyebrow">Расширенное досье по официальным источникам</span>
      <h2 id="pushkinsky-result">Найден суд: {pushkinskyCourt.name}</h2>
      <p>Опубликованные сведения о зданиях, судьях, аппарате суда, участках и порядке обращения.
      Редакционная актуальность требует повторной проверки перед использованием.</p>
    </div>
    <div className="results"><Link className="result-row"
       href={'/courts/'+pushkinskyCourt.region+'/'+pushkinskyCourt.slug}>
       <span><strong>{pushkinskyCourt.name}</strong><small>Московская область · городской суд</small></span>
       <span aria-hidden="true">↗</span>
    </Link></div>
  </section>:null}
  {valid&&hasAny&&moscow.length>0?<section className="section-wrap" aria-labelledby="moscow-matches">
   <div className="section-intro">
    <span className="eyebrow">Справочные карточки Москвы · официальный портал судов</span>
    <h2 id="moscow-matches">Суды Москвы: {moscow.length}</h2>
    <p>Полный официальный перечень: 35 районных судов и Московский городской суд. Двенадцать районных судов имеют расширенные досье; остальные — справочные карточки с контактами и ссылками на первоисточники.</p>
   </div>
   <div className="results">{moscow.map(c=>{
    const hasRich=moscowCourts().some(d=>d.name.toLocaleLowerCase('ru').replace(/ё/g,'е')
      .startsWith(c.name.toLocaleLowerCase('ru').replace(/ё/g,'е')));
    return <Link key={c.slug} className="result-row" href={MoscowOfficialCourtHref(c)}>
     <span><strong>{c.name}</strong>
      <small>Москва · {c.kind==='general-regional'?'городской суд':'районный суд'} · {c.address}</small>
      <small>{hasRich?'Расширенное досье':'Официальная справочная запись'} · {c.office_hours}</small>
     </span><span aria-hidden="true">↗</span>
    </Link>;
   })}</div>
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
  {valid&&hasAny&&researchKindAllowed&&(researchOnly.length>0||official.length===0)?<section className="section-wrap" aria-labelledby="unreviewed-filters">
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
