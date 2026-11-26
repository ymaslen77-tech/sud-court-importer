'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..','app');
const source=require(path.join(ROOT,'data/moscow-oblast-appeal-index-samples.json'));
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('only four exact Moscow oblast appeals from dated official index, no case actors or results',()=>{
 assert.equal(source.records.length,4);
 assert.equal(source.listingDate,'2026-07-23');
 assert.equal(source.observedOn,'2026-11-26');
 assert.equal(source.status,'single_official_index_snapshot_not_case_verified');
 assert.equal(source.sourceIndexUrl,'https://oblsud--mo.sudrf.ru/modules.php?name=sud_delo');
 assert.equal(new Set(source.records.map(x=>x.appealNumber)).size,4);
 const refs=read('lib/official-reference-courts.ts');
 for(const c of source.records){
  assert.match(c.appealNumber,/^33-\d{4,6}\/2026$/);
  assert.match(c.firstInstanceNumber,/^2-\d{1,5}\/202[0-6]$/);
  assert.ok(c.courtName.endsWith('Московской области'));
  assert.ok(refs.includes('slug:"'+c.courtSlug+'",name:"'+c.courtName+'"'));
  assert.ok(c.category.length>15);
  assert.equal(c.caseDetailRead,false);
  assert.equal(c.appealResultVerified,false);
  assert.deepEqual(Object.keys(c).sort(),[
    'appealNumber','appealResultVerified','caseDetailRead','category',
    'courtName','courtSlug','firstInstanceNumber','sourceCaseUrl'
  ].sort());
  const u=new URL(c.sourceCaseUrl);
  assert.equal(u.protocol,'https:');
  assert.equal(u.hostname,'oblsud--mo.sudrf.ru');
  assert.equal(u.pathname,'/modules.php');
  assert.equal(u.searchParams.get('name'),'sud_delo');
  assert.equal(u.searchParams.get('name_op'),'case');
  assert.equal(u.searchParams.get('delo_id'),'5');
  assert.equal(u.searchParams.get('srv_num'),'1');
  assert.match(u.searchParams.get('case_id')??'',/^\d{9}$/);
  assert.match(u.searchParams.get('case_uid')??'',/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/);
 }
});
test('Moscow and Moscow oblast records are legally distinguished',()=>{
 const index=read('lib/moscow-region-case-index.ts');
 const page=read('courts/moscow-region/cases/page.tsx');
 const view=read('_components/moscow-region-case-explorer.tsx');
 assert.match(index,/MOSCOW_JUDGE_CASE_EVIDENCE/);
 assert.match(index,/OFFICIAL_REFERENCE_COURTS\.filter\(c=>c.region==='region-50'/);
 assert.match(index,/detailRead:false,fullTextVerified:false,appealResultVerified:false/);
 assert.match(index,/evidenceStatus:'official_case_metadata'/);
 assert.match(view,/single_official_index_snapshot/);
 assert.match(view,/Прямая карточка дела отдельно не прочитана/);
 assert.match(view,/Текущее движение дела и текст акта не проверены/);
 assert.match(view,/Список Московской области содержит исторические указатели/);
 assert.match(view,/setRegion\(e.target.value as ''\|MoscowRegionCode\);setCourt\(''\);/);
 assert.match(view,/официальный сайт и выбрать «Судебное делопроизводство»/);
 assert.match(page,/robots:\{index:false,follow:true\}/);
 assert.match(page,/Судебные дела Москвы и Московской области/);
});
test('court, search and regional directories link to the combined case finder',()=>{
 const files=[
 'search/page.tsx','courts/moscow/page.tsx','courts/moscow/cases/page.tsx',
 'courts/[region]/page.tsx','courts/reference/[slug]/page.tsx','_components/site-header.tsx'
 ];
 for(const file of files)assert.ok(read(file).includes('/courts/moscow-region/cases'),file);
 assert.match(read('search/page.tsx'),/caseParams\.set\('q',q\)/);
 assert.match(read('courts/reference/[slug]/page.tsx'),/encodeURIComponent\('region-50:'\+court.slug\)/);
 assert.match(read('courts/moscow-region/cases/page.tsx'),/selectedCourt=MOSCOW_REGION_COURTS\.some/);
});
