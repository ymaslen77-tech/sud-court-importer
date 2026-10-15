import {NextResponse} from 'next/server';
import {editorConfigured,hasEditorCredentials} from '../lib/editor-auth';

export const dynamic='force-dynamic';

export async function GET(request:Request){
 if(!editorConfigured()){
  return new Response('Editor dashboard is not configured',{status:404,headers:{'cache-control':'no-store'}});
 }
 if(!await hasEditorCredentials()){
  return new Response('Authentication required',{
   status:401,headers:{
    'WWW-Authenticate':'Basic realm="Courts editorial desk", charset="UTF-8"',
    'cache-control':'no-store','X-Robots-Tag':'noindex, nofollow',
   }
  });
 }
 const url=new URL('/editor/dashboard',request.url);
 const response=NextResponse.redirect(url,{status:302});
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('X-Robots-Tag','noindex, nofollow');
 return response;
}
