/** Index the nine MGS pages only after editorial release on the canonical public domain.
 * Never automatically publish preview/staging hosts to search engines.
 */
import {MGS_BASE,MGS_GUIDE_TOPICS,mgsGuideHref} from './moscow-city-court-guide';

function canonicalPublicSite():URL|null{
 const raw=process.env.PUBLIC_SITE_URL;
 if(!raw)return null;
 try{
  const url=new URL(raw);
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:' || url.username || url.password || url.pathname!=='/' ||
     url.search || url.hash ||
     /(^localhost$|^127\.|^0\.|^192\.168\.|\.local$|sslip\.io$|nip\.io$|preview|staging|develop|test\.)/i.test(host)){
   return null;
  }
  return url;
 }catch{return null;}
}
export function mgsSeoIndexable(){
 return process.env.SEO_MOSCOW_CITY_COURT_INDEXABLE==='true' && canonicalPublicSite()!==null;
}
export function mgsSeoRobots(){
 return mgsSeoIndexable()?{index:true,follow:true}:{index:false,follow:true};
}
export function mgsSeoAbsoluteUrl(path:string):string|null{
 const site=canonicalPublicSite();
 if(!site)return null;
 if(!path.startsWith('/') || path.startsWith('//'))return null;
 return new URL(path,site).toString();
}
export const MGS_SEO_PATHS=[MGS_BASE,...MGS_GUIDE_TOPICS.map(x=>mgsGuideHref(x.slug))] as const;
export function mgsSeoStructuredData(title:string,description:string,path:string,section?:string){
 if(!mgsSeoIndexable())return null;
 const url=mgsSeoAbsoluteUrl(path);
 const site=mgsSeoAbsoluteUrl('/');
 const court=mgsSeoAbsoluteUrl(MGS_BASE);
 const moscow=mgsSeoAbsoluteUrl('/courts/moscow');
 const courts=mgsSeoAbsoluteUrl('/courts');
 if(!url || !site || !court || !moscow || !courts)return null;
 const items=[
  {name:'Суды России',item:courts},
  {name:'Суды Москвы',item:moscow},
  {name:'Московский городской суд',item:court},
  ...(section?[{name:section,item:url}]:[])
 ];
 const data={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'WebPage','@id':url,name:title,description,inLanguage:'ru',
    isPartOf:{'@type':'WebSite',name:'Суды России',url:site},
    about:{'@type':'Courthouse',name:'Московский городской суд',
     url:'https://mos-gorsud.ru/mgs'}},
   {'@type':'BreadcrumbList',itemListElement:items.map((item,i)=>({
    '@type':'ListItem',position:i+1,name:item.name,item:item.item}))}
  ]
 };
 return JSON.stringify(data).replace(/</g,'\\u003c');
}
