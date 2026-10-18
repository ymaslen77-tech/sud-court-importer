import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {moscowCourt} from '../../lib/moscow-courts';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const types=new Set(['question','callback']);
const topics=new Set(['Подсудность','Подача иска','Обжалование решения','Поиск судебного дела','Госпошлина','Подготовка документов','Другой вопрос']);
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
function error(message:string,status:number){return NextResponse.json({ok:false,error:message},{status,headers});}
function configured(){
 try{
  const uri=new URL(process.env.COURT_LEADS_WEBHOOK_URL??'');
  return process.env.COURT_LEADS_ENABLED==='true' &&
   process.env.COURT_LEADS_RU_STORAGE_ATTESTED==='true' &&
   Boolean(process.env.COURT_LEADS_OPERATOR_NAME?.trim()) &&
   Boolean(process.env.COURT_LEADS_PRIVACY_URL?.startsWith('https://')) &&
   Boolean(process.env.COURT_LEADS_WEBHOOK_TOKEN && process.env.COURT_LEADS_WEBHOOK_TOKEN.length>=32) &&
   uri.protocol==='https:'&&!uri.username&&!uri.password&&!uri.port;
 }catch{return false;}
}
export async function POST(req:NextRequest){
 if(!configured())return error('SERVICE_NOT_CONFIGURED',503);
 const origin=req.headers.get('origin');
 if(!origin||origin!==req.nextUrl.origin)return error('ORIGIN_MISMATCH',403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return error('INVALID_CONTENT_TYPE',415);
 if(Number(req.headers.get('content-length')??0)>3000)return error('PAYLOAD_TOO_LARGE',413);
 let value:unknown;
 try{value=await req.json();}catch{return error('INVALID_JSON',400);}
 if(!value||typeof value!=='object'||Array.isArray(value))return error('INVALID_REQUEST',400);
 const d=value as Record<string,unknown>;
 const fields=['slug','fullName','contact','topic','message','honeypot','requestType'];
 if(fields.some(k=>d[k]!==undefined&&typeof d[k]!=='string'))return error('INVALID_FIELDS',400);
 const str=(key:string)=>String(d[key]??'').trim();
 const [slug,fullName,contact,topic,message,honeypot,requestType]=fields.map(str);
 if(!moscowCourt(slug)||fullName.length<2||fullName.length>80||
   contact.length<5||contact.length>130||message.length>400||honeypot.length||
   !topics.has(topic)||!types.has(requestType)||d.consent!==true)return error('VALIDATION_FAILED',422);
 if(!/^[+\d()\s-]{7,25}$/.test(contact)&& !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))return error('INVALID_CONTACT',422);
 const payload={id:randomUUID(),court_slug:slug,name:fullName,contact,topic,message,kind:requestType,consent_at:new Date().toISOString(),source_page:'/courts/moscow/'+slug};
 try{
  const out=await fetch(process.env.COURT_LEADS_WEBHOOK_URL!,{
   method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.COURT_LEADS_WEBHOOK_TOKEN!,
    'X-Request-Id':payload.id},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(8000)
  });
  if(!out.ok)return error('DELIVERY_FAILED',502);
  return NextResponse.json({ok:true},{status:202,headers});
 }catch{return error('DELIVERY_UNAVAILABLE',503);}
}
