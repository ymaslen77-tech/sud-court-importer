import {NextResponse} from 'next/server';
import {editorConfigured,hasEditorCredentials,validEditorReviewToken,validReviewKind} from '../../lib/editor-auth';

export const dynamic='force-dynamic';

/** Acknowledges a source observation only; cannot approve an appointment or court. */
export async function POST(request:Request){
 if(!editorConfigured()||!await hasEditorCredentials()){
  return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
 }
 const origin=request.headers.get('origin');
 const host=request.headers.get('host');
 // Next's internal request.url can contain the container hostname/port.
 // Compare the browser Origin against the actual Host header instead.
 let sameOrigin=false;
 try{
  const parsed=new URL(origin??'');
  const loopback=parsed.hostname==='localhost'||parsed.hostname==='127.0.0.1'||parsed.hostname==='[::1]';
  sameOrigin=Boolean(host) && parsed.host===host &&
   (parsed.protocol==='https:'||(parsed.protocol==='http:'&&loopback));
 }catch{ /* Missing or malformed origin: deny. */ }
 if(!sameOrigin){
  return new Response('Invalid request origin',{status:403,headers:{'cache-control':'no-store'}});
 }
 if(!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/x-www-form-urlencoded')){
  return new Response('Unsupported form',{status:415,headers:{'cache-control':'no-store'}});
 }
 const raw=await request.text();
 if(raw.length>2048)return new Response('Form too large',{status:413});
 const form=new URLSearchParams(raw);
 const validKeys=['kind','itemId','csrf','decision','attest'];
 if([...form.keys()].some(k=>!validKeys.includes(k))||validKeys.some(k=>form.getAll(k).length!==1)){
  return new Response('Invalid review fields',{status:400});
 }
 const kind=form.get('kind')??'';
 const itemId=form.get('itemId')??'';
 const csrf=form.get('csrf')??'';
 const decision=form.get('decision');
 if(!validReviewKind(kind)||!['reviewed','ignored'].includes(decision??'')||form.get('attest')!=='on'||
    !validEditorReviewToken(itemId,csrf,kind)){
  return new Response('Review attestation or request token invalid',{status:403,
   headers:{'cache-control':'no-store'}});
 }
 const reviewer=process.env.EDITOR_USERNAME!;
 const api=process.env.API_URL??'http://localhost:4000';
 let response:Response;
 try{
  response=await fetch(api+'/api/v1/internal/editor/signals/'+kind+'/'+itemId+'/review',{
   method:'POST',cache:'no-store',headers:{
    authorization:'Bearer '+process.env.EDITOR_API_TOKEN,
    'content-type':'application/json',
   },
   body:JSON.stringify({decision,attested:true,reviewer})
  });
 }catch{
  return new Response('Internal review API unavailable',{status:503,headers:{'cache-control':'no-store'}});
 }
 if(!response.ok){
  return new Response('Review not completed',{status:response.status===404?409:503,
    headers:{'cache-control':'no-store'}});
 }
 const result=NextResponse.redirect(new URL('/editor/dashboard',request.url),303);
 result.headers.set('cache-control','private,no-store');
 result.headers.set('X-Robots-Tag','noindex,nofollow');
 return result;
}
