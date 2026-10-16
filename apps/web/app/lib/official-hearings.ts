import {pilotPublicRecord} from './pilot-public';

/** Source-validated public schedules only. No parties, allegations or sensitive details. */
export type Hearing={caseNumber:string;time:string;room:string;judge:string;url:string|null};
export type TodaySchedule={
  state:'available'|'empty'|'unavailable';
  courtCode:string; date:string; checkedAt:string|null; sourceUrl:string;
  hearings:Hearing[]; message:string; truncated:boolean;
};
const DECODE:Record<string,string>={amp:'&',quot:'"',apos:"'",nbsp:' ',laquo:'«',raquo:'»',ndash:'–',mdash:'—',lt:'<',gt:'>'};
function textOf(html:string):string {
 return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
 .replace(/<[^>]+>/g,' ').replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi,(_,v:string)=>{
   if(v[0]==='#'){
     const n=v[1].toLowerCase()==='x'?parseInt(v.slice(2),16):parseInt(v.slice(1),10);
     return n>=32&&n<=0x10ffff?String.fromCodePoint(n):' ';
   }
   return DECODE[v.toLowerCase()]??' ';
 }).replace(/\s+/g,' ').trim();
}
function officialUrl(href:string,host:string):string|null {
 try{
   if(!href || href.startsWith('//'))return null;
   const url=new URL(href,'https://'+host+'/');
   return url.protocol==='https:'&&url.hostname===host&&!url.username&&!url.password&&url.port==='' &&
     url.pathname==='/modules.php'&&url.searchParams.get('name')==='sud_delo' &&
     url.searchParams.get('name_op')==='case' ? url.toString():null;
 }catch{return null;}
}
export function parseOfficialHearings(html:string,expectedDate:string,host:string):{state:'available'|'empty';hearings:Hearing[];truncated:boolean}|null {
 if(html.length>2_000_000)return null;
 const heading=textOf(html.match(/Список дел,\s*назначенных к слушанию на\s*\d{2}\.\d{2}\.\d{4}/i)?.[0]||'');
 const dateInHeading=heading.match(/(\d{2}\.\d{2}\.\d{4})/);
 if(!dateInHeading){
   const empty=textOf(html).match(/На\s*(\d{2}\.\d{2}\.\d{4})\s*дел не назначено/i);
   return empty?.[1]===expectedDate?{state:'empty',hearings:[],truncated:false}:null;
 }
 if(dateInHeading[1]!==expectedDate)return null; // never publish another day's cases
 const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
 const hearings:Hearing[]=[];
 for(const [,row] of rows){
  const cells=[...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(x=>x[1]);
  if(cells.length<4)continue;
  const no=textOf(cells[1]||'').slice(0,90);
  const t=textOf(cells[2]||'').match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
  // Ignore headers, pagination, duplicate headings and unrecognized formats
  if(!t||!/^\d{1,2}[А-ЯA-Zа-яa-zК]?[-/\w .№~;()]{1,85}$/.test(no)||!/[0-9]/.test(no))continue;
  const match=cells[1].match(/<a\b[^>]*href=["']([^"']+)["']/i);
  const url=match?officialUrl(match[1].replace(/&amp;/g,'&'),host):null;
  hearings.push({caseNumber:no,time:t[0].padStart(5,'0'),room:textOf(cells[3]||'').slice(0,100),
   judge:textOf(cells[5]||'').slice(0,110),url});
  if(hearings.length>=400)break;
 }
 if(!hearings.length)return null; // fail closed instead of pretending an empty schedule
 return {state:'available',hearings,truncated:hearings.length===400};
}
export function todayForRegion(region:string,date:Date=new Date()):{iso:string;ru:string}{
 const zone=region==='55'?'Asia/Omsk':'Asia/Novosibirsk';
 const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'2-digit',month:'2-digit',year:'numeric'});
 const parts=fmt.formatToParts(date);
 const val=(key:string)=>parts.find(x=>x.type===key)?.value||'';
 const d=val('day'),m=val('month'),y=val('year');
 return {iso:`${y}-${m}-${d}`,ru:`${d}.${m}.${y}`};
}
export async function getCourtHearingsToday(code:string):Promise<TodaySchedule>{
 const court=pilotPublicRecord(code);
 if(!court)throw new Error('Unknown published pilot court');
 const date=todayForRegion(court.region_code);
 const host=new URL(court.https_site_url).hostname;
 const url=new URL('https://'+host+'/modules.php');
 url.searchParams.set('name','sud_delo');
 url.searchParams.set('srv_num','1');
 url.searchParams.set('H_date',date.ru);
 const base={courtCode:code,date:date.iso,sourceUrl:url.toString()};
 const unavailable=(msg:string):TodaySchedule=>({...base,state:'unavailable',checkedAt:null,hearings:[],message:msg,truncated:false});
 // Site administrators may disable public machine access. Never circumvent denial,
 // CAPTCHA, robots limits or anti-bot controls.
 try{
   const response=await fetch(url,{headers:{Accept:'text/html'},next:{revalidate:3600},signal:AbortSignal.timeout(6500)});
   if(!response.ok || !String(response.headers.get('content-type')||'').includes('text/html')){
     return unavailable('Официальный источник не предоставил доступное расписание.');
   }
   const length=Number(response.headers.get('content-length')||0);
   if(length>2_000_000)return unavailable('Ответ официального источника слишком большой.');
   const html=await response.text();
   const parsed=parseOfficialHearings(html,date.ru,host);
   if(!parsed)return unavailable('Не удалось удостоверить дату или формат опубликованного расписания.');
   return {...base,checkedAt:new Date().toISOString(),state:parsed.state,hearings:parsed.hearings,
      truncated:parsed.truncated,message:parsed.state==='empty'?'На выбранную дату на официальной странице дел не назначено.':
      'Сведения извлечены из официальной публикации на указанную дату; заседания могут переноситься.'};
 }catch{return unavailable('Не удалось подключиться к судебному расписанию. Не показываем данные за другую дату.');}
}
