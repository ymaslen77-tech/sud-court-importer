import {createHash,timingSafeEqual} from 'node:crypto';
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
