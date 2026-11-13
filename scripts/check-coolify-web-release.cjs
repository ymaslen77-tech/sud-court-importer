#!/usr/bin/env node
'use strict';
/**
 * Read-only production smoke test after the owner triggers Coolify Deploy.
 * No service control, credentials, logins, publishing, or private case data.
 * The independent research pages must remain noindex until legal acceptance.
 */
const BASE = 'https://sud-russia.ru';
const ROLES = [
 {path:'/courts/moscow',phrases:['Суды Москвы']},
 {path:'/courts/moscow/judges',phrases:['Судьи по каждому из 35 районных судов Москвы'],noindex:true},
 {path:'/courts/moscow/cases',phrases:['Поиск судебных дел Москвы','Результат пересмотра не установлен'],noindex:true},
 {path:'/courts/moscow/registry/shcherbinskiy/info/judges',
  phrases:['Будигина Наталья Геннадьевна','Патапенкова Юлия Александровна','2026-10-21'],noindex:true},
 {path:'/courts/moscow/registry/nikulinskiy/info/cases',
  phrases:['33-53951/2026','19.11.2026'],noindex:true}
];
const allowedHosts=new Set(['sud-russia.ru','www.sud-russia.ru']);
function verifyBase(value){
 const url=new URL(value);
 if(url.protocol!=='https:'||!allowedHosts.has(url.hostname)||url.port||
  url.username||url.password||url.search||url.hash||url.pathname!=='/'){
  throw Error('Only approved HTTPS production host is allowed: sud-russia.ru');
 }
 return url.origin;
}
function hasNoindex(html){
 return [...html.matchAll(/<meta\b[^>]+>/gi)].some(([tag])=>
  /name=["']robots["']/i.test(tag)&&/content=["'][^"']*noindex/i.test(tag));
}
async function checkRelease(fetcher=fetch,base=BASE){
 const origin=verifyBase(base);
 const results=[];
 for(const item of ROLES){
  const url=origin+item.path;
  const response=await fetcher(url,{redirect:'follow',
   signal:AbortSignal.timeout(15000),
   headers:{'Accept':'text/html','User-Agent':'sudy-release-smoke/1.0'}});
  const location=new URL(response.url||url);
  if(!allowedHosts.has(location.hostname)||location.protocol!=='https:'){
   throw Error('Unexpected redirect outside approved production domains');
  }
  if(response.status!==200)throw Error(item.path+': HTTP '+response.status);
  const html=await response.text();
  if(html.length<500)throw Error(item.path+': suspiciously small HTML response');
  for(const phrase of item.phrases){
   if(!html.includes(phrase))throw Error(item.path+': missing expected release marker '+phrase);
  }
  if(item.noindex&&!hasNoindex(html))throw Error(item.path+': missing noindex legal-review gate');
  results.push({route:item.path,httpStatus:response.status,
   expectedMarkers:item.phrases.length,noindexRequired:!!item.noindex,
   passed:true});
 }
 return {publishedResearchRevision:'29 dated court judge rosters; 6 remaining',
  observedOn:new Date().toISOString(),productionBase:origin,
  checks:results,passed:true,
  legalAcceptanceComplete:false};
}
if(require.main===module){
 checkRelease().then(x=>console.log(JSON.stringify(x,null,2))).catch(e=>{
  console.error('Coolify public release NOT verified: '+e.message);
  process.exitCode=1;
 });
}
module.exports={checkRelease,verifyBase,hasNoindex,ROLES};
