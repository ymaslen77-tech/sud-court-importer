import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {headers} from 'next/headers';

/** Fail closed: editor dashboard is disabled until strong credentials exist. */
export function editorConfigured():boolean {
 return process.env.EDITOR_DASHBOARD_ENABLED==='true' &&
  (process.env.EDITOR_USERNAME?.length??0)>=3 &&
  (process.env.EDITOR_PASSWORD?.length??0)>=16 &&
  (process.env.EDITOR_API_TOKEN?.length??0)>=32;
}

function equal(left:string,right:string):boolean {
 const a=createHash('sha256').update(left,'utf8').digest();
 const b=createHash('sha256').update(right,'utf8').digest();
 return timingSafeEqual(a,b);
}

export async function hasEditorCredentials():Promise<boolean>{
 if(!editorConfigured())return false;
 const header=(await headers()).get('authorization')??'';
 if(!header.startsWith('Basic ') || header.length>1024)return false;
 try{
  const decoded=Buffer.from(header.slice(6),'base64').toString('utf8');
  const index=decoded.indexOf(':');
  if(index<0)return false;
  return equal(decoded.slice(0,index),process.env.EDITOR_USERNAME!) &&
    equal(decoded.slice(index+1),process.env.EDITOR_PASSWORD!);
 }catch{return false;}
}

export type EditorOverview={
 generated_at:string;
 public_courts:{published:number;stale:number};
 review_queues:{kind:string;count:number}[];
 source_monitor:{enabled:number;overdue:number;failed:number;last_checked:string|null};
 by_region:{code:string;name:string;published:number}[];
 recent_review_items:{kind:string;item_id:string;court:string;field:string;value:string;source_url:string;observed_at:string}[];
 intake_recent_runs:{id:string;finished_at:string;handled:number;failed:number;manifest_count:number}[];
 warning:string;
};

export async function loadEditorOverview():Promise<EditorOverview>{
 const base=process.env.API_URL??'http://localhost:4000';
 const response=await fetch(base+'/api/v1/internal/editor/overview',{
  cache:'no-store',headers:{authorization:'Bearer '+process.env.EDITOR_API_TOKEN}
 });
 if(!response.ok)throw new Error('PRIVATE_EDITOR_UNAVAILABLE');
 return response.json() as Promise<EditorOverview>;
}

/** Only review-only queues are allowed to receive signable form intents. */
export const REVIEW_SIGNAL_KINDS=['staff_roster_diffs','registry_diffs','source_changes'] as const;
export function validReviewKind(value:string):boolean{
 return REVIEW_SIGNAL_KINDS.some(kind=>kind===value);
}

/** Short-lived HMAC intent bound to both record ID and review queue. */
export function editorReviewToken(itemId:string,kind='staff_roster_diffs',now=Math.floor(Date.now()/1000)):string{
 if(!editorConfigured()||!/^[1-9][0-9]{0,14}$/.test(itemId)||!validReviewKind(kind))
  throw new Error('EDITOR_REVIEW_UNAVAILABLE');
 const secret=process.env.EDITOR_API_TOKEN!;
 const mac=createHmac('sha256',secret)
  .update(String(now)+':'+kind+':'+itemId+':'+process.env.EDITOR_USERNAME)
  .digest('hex');
 return String(now)+'.'+mac;
}

export function validEditorReviewToken(itemId:string,token:string,kind='staff_roster_diffs',
  now=Math.floor(Date.now()/1000)):boolean{
 if(!editorConfigured()||!/^[1-9][0-9]{0,14}$/.test(itemId)||!validReviewKind(kind)||
    !/^\d{10}\.[a-f0-9]{64}$/.test(token))return false;
 const stamp=Number(token.slice(0,10));
 if(!Number.isSafeInteger(stamp)||stamp>now||now-stamp>900)return false;
 const expected=editorReviewToken(itemId,kind,stamp);
 return timingSafeEqual(Buffer.from(token,'utf8'),Buffer.from(expected,'utf8'));
}
