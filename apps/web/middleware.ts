import {NextRequest,NextResponse} from 'next/server';

/** Search crawlers may reach the VPS preview through a second hostname.
 * Prevent previews from being indexed even if PUBLIC_SITE_URL points to production.
 * Do not Disallow these pages in robots.txt: crawlers must see X-Robots-Tag.
 */
export function middleware(request:NextRequest){
 const host=request.nextUrl.hostname.toLowerCase();
 const preview=host==='localhost'||host==='127.0.0.1'||
   host.endsWith('.sslip.io')||host.endsWith('.nip.io')||
   /(^|[.-])(preview|staging|development|test)([.-]|$)/.test(host);
 const response=NextResponse.next();
 if(preview)response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
