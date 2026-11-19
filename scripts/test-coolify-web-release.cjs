'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {checkRelease,verifyBase,hasNoindex,ROLES}=require('../scripts/check-coolify-web-release.cjs');
const fakeHtml=(item)=>'<html><head><meta name="robots" content="noindex, follow"/></head><body>'+
 item.phrases.join(' ')+'-'.repeat(800)+'</body></html>';
const mock=(alter=()=>undefined)=>async (url)=>{
 const item=ROLES.find(x=>url.endsWith(x.path));
 assert.ok(item,'unexpected URL '+url);
 const override=alter(item)||{};
 return {status:override.status??200,url:override.url??url,
 text:async()=>override.html??fakeHtml(item)};
};
test('preflight only accepts official configured production origin',()=>{
 assert.equal(verifyBase('https://sud-russia.ru'),'https://sud-russia.ru');
 assert.equal(verifyBase('https://www.sud-russia.ru'),'https://www.sud-russia.ru');
 for(const url of ['http://sud-russia.ru','https://example.com',
  'https://sud-russia.ru.evil.com','https://sud-russia.ru:8443',
  'https://sud-russia.ru/private','https://sud-russia.ru?x=1']){
  assert.throws(()=>verifyBase(url));
 }
});
test('read-only checks all public routes plus noindex and official roster content',async ()=>{
 const report=await checkRelease(mock());
 assert.equal(report.checks.length,ROLES.length);
 assert.ok(report.passed);
 assert.equal(report.legalAcceptanceComplete,false);
 assert.ok(report.checks.every(c=>c.passed));
});
test('refuse missing judicial judge name, stale or missing appeal snapshot',async ()=>{
 for(const term of ['Будигина Наталья Геннадьевна','33-53951/2026']){
  await assert.rejects(checkRelease(mock(item=>item.phrases.includes(term)?{
    html:fakeHtml(item).replace(term,'Удалено')
   }:null)),/missing expected release marker/);
 }
});
test('refuse 404, non-official redirect and dropped noindex',async ()=>{
 await assert.rejects(checkRelease(mock(item=>item.path==='/courts/moscow'?{status:404}:null)),/HTTP 404/);
 await assert.rejects(checkRelease(mock(item=>item.path==='/courts/moscow'?{
  url:'https://bad.example.com/'
 }:null)),/Unexpected redirect/);
 await assert.rejects(checkRelease(mock(item=>item.noindex?{
  html:fakeHtml(item).replace('<meta name="robots" content="noindex, follow"/>','')
 }:null)),/missing noindex/);
});
test('strict robots tag detection cannot be fooled by page text',()=>{
 assert.equal(hasNoindex('<p>noindex</p>'),false);
 assert.equal(hasNoindex('<meta content="noindex,follow" name="robots"/>'),true);
 assert.equal(hasNoindex('<meta name="robots" content="index,follow"/>'),false);
});
