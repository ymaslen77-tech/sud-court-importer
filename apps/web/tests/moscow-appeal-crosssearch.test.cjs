'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const APP=path.join(__dirname,'..','app');
const read=p=>fs.readFileSync(path.join(APP,p),'utf8');
const json=p=>JSON.parse(read(p));
function compile(source,fileName,deps={}){
 const output=ts.transpileModule(source,{
  fileName,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
   esModuleInterop:true,strict:true},reportDiagnostics:true
 });
 const errors=output.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)||[];
 assert.deepEqual(errors.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')),[]);
 const module={exports:{}};
 new Function('require','module','exports',output.outputText)((name)=>{
  assert.ok(Object.hasOwn(deps,name),'Unexpected dependency '+name);
  return deps[name];
 },module,module.exports);
 return module.exports;
}
const search=compile(read('lib/moscow-region-case-search.ts'),
 'moscow-region-case-search.ts');
const links=json('data/moscow-judge-crosschecked-cases.json').records;
const appointments=json('data/moscow-appeal-hearing-snapshots.json').records;
const oblast=json('data/moscow-oblast-appeal-index-samples.json');
const cached=json('data/moscow-oblast-cached-appeals.json');
const courtFixtures=[
 {slug:'nikulinskiy',kind:'general-district',name:'Никулинский районный суд города Москвы',source_url:'https://mos-gorsud.ru/rs/nikulinskij'},
 {slug:'meshchanskiy',kind:'general-district',name:'Мещанский районный суд города Москвы',source_url:'https://mos-gorsud.ru/rs/meshchanskij'}
];
const originalRows=links.map(x=>({
 courtSlug:x.courtSlug,number:x.caseNumber,judgeName:x.judgeName,
 category:'Проверяемая категория',proceeding:'civil',
 status:'outcome_recorded',outcome:x.courtOutcome,
 observedOn:x.reviewedOn,decisionDate:x.courtDecisionDate,
 sourceUrl:x.witnesses.find(w=>w.kind==='first_instance').sourceUrl
}));
const oblastCourts=[...oblast.records,...cached.records].map(x=>({
 slug:x.courtSlug,name:x.courtName,region:'region-50',
 kind:'general-district',officialUrl:'https://usd--mo.sudrf.ru/modules.php?name=sud'
}));
const unique=new Map(oblastCourts.map(x=>[x.slug,x]));
unique.set('moscow-oblast-court',{slug:'moscow-oblast-court',
 name:'Московский областной суд',region:'region-50',kind:'general-regional',
 officialUrl:'https://oblsud--mo.sudrf.ru'});
const index=compile(read('lib/moscow-region-case-index.ts'),'moscow-region-case-index.ts',{
 './moscow-judge-directory':{MOSCOW_JUDGE_CASE_EVIDENCE:originalRows},
 './moscow-judge-crosschecks':{moscowJudgeCaseCrosscheck:(courtSlug,caseNumber)=>
  links.find(c=>c.courtSlug===courtSlug&&c.caseNumber===caseNumber)??null},
 './moscow-appeal-hearing-snapshots':{moscowAppealHearingSnapshot:(courtSlug,caseNumber)=>
  appointments.find(c=>c.courtSlug===courtSlug&&c.caseNumber===caseNumber)??null},
 './moscow-official-minimum':{MOSCOW_OFFICIAL_MINIMUM_COURTS:courtFixtures,
  MoscowOfficialCourtHref:c=>'/courts/moscow/'+c.slug},
 './official-reference-courts':{OFFICIAL_REFERENCE_COURTS:[...unique.values()]},
 './oblast-portal-evidence':compile(read('lib/oblast-portal-evidence.ts'),'oblast-portal-evidence.ts'),
 './court-rich-records':compile(read('lib/court-rich-records.ts'),'court-rich-records.ts'),
 '../data/moscow-oblast-appeal-index-samples.json':oblast,
 '../data/moscow-oblast-cached-appeals.json':cached
});
const entries=index.MOSCOW_REGION_CASES;

test('all two official Moscow appeal identifiers are indexed; only verified appellate number shown',()=>{
 assert.equal(entries.length,10);
 const nik=entries.find(x=>x.region==='moscow'&&x.courtSlug==='nikulinskiy');
 const mesh=entries.find(x=>x.region==='moscow'&&x.courtSlug==='meshchanskiy');
 assert.equal(nik.number,'02-0514/2026');
 assert.equal(nik.appealDocket,'Ж-65034/2026');
 assert.equal(nik.appealNumber,'33-53951/2026');
 assert.equal(nik.appealRegisteredOn,'2026-09-30');
 assert.equal(nik.appealHearingDate,'2026-11-19');
 assert.equal(nik.appealHearingObservedOn,'2026-11-13');
 assert.ok(nik.appealSourceUrl.startsWith('https://m.mos-gorsud.ru/mgs/services/cases/appeal-civil/details/'));
 assert.equal(mesh.appealDocket,'Ж-64264/2026');
 assert.equal(mesh.appealNumber,null,'Never invent an appellate case number for the Meshchansky record');
 assert.equal(mesh.appealHearingDate,null);
 assert.equal(mesh.appealHearingObservedOn,null);
 assert.ok(mesh.appealSourceUrl.startsWith('https://m.mos-gorsud.ru/mgs/services/cases/appeal-civil/details/'));
 assert.ok([nik,mesh].every(x=>x.appealResultVerified===false&&x.fullTextVerified===false));
 assert.ok([nik,mesh].every(x=>x.dispositionScope==='first_instance_registry'));
});
test('same search works for original number, appeal case number, appeal material and regional source',()=>{
 const nik=entries.find(x=>x.courtSlug==='nikulinskiy');
 const mesh=entries.find(x=>x.courtSlug==='meshchanskiy');
 const oblastCase=entries.find(x=>x.number==='33-32970/2026');
 for(const q of ['02-0514/2026','33-53951/2026','ж-65034/2026',
  'Ж ‑ 65034 / 2026','никулинский','Кузнецова']){
  assert.ok(search.matchesSourceBoundMoscowCase(nik,q),'Missing Nikulinsky '+q);
 }
 for(const q of ['02-2880/2026','Ж-64264/2026','боярникова']){
  assert.ok(search.matchesSourceBoundMoscowCase(mesh,q),'Missing Meshchansky '+q);
 }
 for(const q of ['33-32970/2026','2-3944/2026','мытищинский']){
  assert.ok(search.matchesSourceBoundMoscowCase(oblastCase,q),'Missing oblast '+q);
 }
 assert.equal(search.matchesSourceBoundMoscowCase(mesh,'33-53951/2026'),false);
 assert.equal(search.matchesSourceBoundMoscowCase(nik,'Ж-64264/2026'),false);
 assert.equal(search.matchesSourceBoundMoscowCase(nik,'несуществующее производство'),false);
 assert.equal(search.matchesSourceBoundMoscowCase(nik,''),true);
 assert.equal(search.normalizeMoscowCaseQuery('Ж — 65034 / 2026'),'ж-65034/2026');
});
test('historical appointment date is elapsed without inferring occurrence or appeal outcome',()=>{
 assert.equal(search.isPastPublishedHearingDate('2026-11-19','2026-11-27'),true);
 assert.equal(search.isPastPublishedHearingDate('2026-11-19','2026-11-19'),false);
 assert.equal(search.isPastPublishedHearingDate('2026-12-05','2026-11-27'),false);
 assert.equal(search.isPastPublishedHearingDate('incorrect','2026-11-27'),false);
 assert.equal(search.isPastPublishedHearingDate('2026-11-19','incorrect'),false);
 for(const x of entries){
  assert.equal(x.appealResultVerified,false);
  assert.equal(x.fullTextVerified,false);
  if(x.region==='region-50'){
   assert.equal(x.appealDocket,null);
   assert.equal(x.appealSourceUrl,null);
   assert.equal(x.appealHearingDate,null);
   assert.ok(['single_official_index_snapshot','cached_official_case_metadata'].includes(x.evidenceStatus));
  }
 }
});
test('appeal and historical warnings appear in the accessible public search UIs',()=>{
 const global=read('search/page.tsx');
 const unified=read('_components/moscow-region-case-explorer.tsx');
 const moscow=read('_components/moscow-case-index-explorer.tsx');
 const district=read('_components/moscow-court-published-evidence.tsx');
 const page=read('courts/moscow-region/cases/page.tsx');
 const model=read('lib/moscow-region-case-index.ts');
 assert.match(global,/matchesSourceBoundMoscowCase\(c,caseQuery\)/);
 assert.match(unified,/matchesSourceBoundMoscowCase\(c,query\)/);
 assert.match(global,/Карточка апелляционного материала/);
 assert.match(unified,/Карточка апелляционного материала/);
 assert.match(model,/moscowJudgeCaseCrosscheck\(c.courtSlug,c.number\)/);
 assert.match(model,/moscowAppealHearingSnapshot\(c.courtSlug,c.number\)/);
 assert.match(moscow,/isPastPublishedHearingDate\(c.appealSchedule.hearingDate\)/);
 assert.match(district,/isPastPublishedHearingDate\(hearing.hearingDate\)/);
 assert.match(unified,/не является актуальным расписанием/);
 assert.match(page,/robots:\{index:false,follow:true\}/);
});

test('empty case results respect selected court and region instead of redirecting to a different court',()=>{
 const district={region:'region-50',officialUrl:'http://domodedovo.mo.sudrf.ru/',officialCaseSearchUrl:null};
 const regional=index.MOSCOW_REGION_COURTS.find(c=>c.slug==='moscow-oblast-court');
 const moscow=index.MOSCOW_REGION_COURTS.find(c=>c.slug==='nikulinskiy');
 const hrefs=(region,court)=>search.officialCaseSearchDestinations(region,court).map(x=>x.href);
 assert.deepEqual(hrefs('region-50',district),[district.officialUrl]);
 assert.deepEqual(hrefs('',district),[district.officialUrl]);
 assert.deepEqual(hrefs('region-50',regional),[regional.officialCaseSearchUrl]);
 assert.deepEqual(hrefs('',moscow),['https://mos-gorsud.ru/search']);
 assert.deepEqual(hrefs('moscow'),['https://mos-gorsud.ru/search']);
 assert.deepEqual(hrefs('region-50'),['/courts/region-50','https://oblsud--mo.sudrf.ru/modules.php?name=sud_delo']);
 assert.deepEqual(hrefs(''),['https://mos-gorsud.ru/search','/courts/region-50','https://oblsud--mo.sudrf.ru/modules.php?name=sud_delo']);
 assert.equal(search.officialCaseSearchDestinations('region-50')[0].external,false);
 const view=read('_components/moscow-region-case-explorer.tsx');
 assert.match(view,/officialCaseSearchDestinations\(region,selectedCourt\)/);
 assert.match(view,/destinations\.map/);
 assert.doesNotMatch(view,/officialPortal/);
});

test('four additional cached oblast cards match both numbers but never imply current status or result',()=>{
 assert.equal(cached.status,'cached_official_case_metadata_not_live_verified');
 assert.equal(cached.records.length,4);
 const previous=new Set(oblast.records.map(c=>c.appealNumber));
 for(const c of cached.records){
  assert.ok(!previous.has(c.appealNumber));
  assert.deepEqual(Object.keys(c).sort(),['appealNumber','appealResultVerified','category','courtName','courtSlug','firstInstanceNumber','fullTextVerified','sourceCaseUrl'].sort());
  const url=new URL(c.sourceCaseUrl);
  assert.equal(url.hostname,'oblsud--mo.sudrf.ru');
  assert.equal(url.searchParams.get('name_op'),'case');
  const row=entries.find(x=>x.number===c.appealNumber);
  assert.ok(row);
  assert.equal(row.evidenceStatus,'cached_official_case_metadata');
  assert.ok(search.matchesSourceBoundMoscowCase(row,c.firstInstanceNumber));
  assert.ok(search.matchesSourceBoundMoscowCase(row,c.appealNumber));
  assert.equal(row.disposition,null);
  assert.equal(row.recordDate,null);
  assert.equal(row.appealResultVerified,false);
  assert.equal(row.fullTextVerified,false);
  assert.equal(row.judgeName,null);
 }
 assert.match(read('_components/moscow-region-case-explorer.tsx'),/Сохранённая копия официальной карточки/);
 assert.match(read('search/page.tsx'),/текущий статус и исход не проверены/);
});

test('published direct links remain separate from live verification; rich Pushkin dossier participates in search',()=>{
 const ev=compile(read('lib/oblast-portal-evidence.ts'),'oblast-portal-evidence.ts').OBLAST_PORTAL_EVIDENCE;
 assert.equal(Object.keys(ev).length,8);
 for(const e of Object.values(ev)){
  const u=new URL(e.url);
  assert.equal(u.protocol,'https:');
  assert.ok(u.hostname.endsWith('.sudrf.ru'));
  assert.equal(u.searchParams.get('name'),'sud_delo');
 }
 const push=index.MOSCOW_REGION_COURTS.find(c=>c.slug==='pushkinsky-gorodskoy');
 assert.ok(push);
 assert.equal(push.href,'/courts/region-50/pushkinsky-gorodskoy');
 assert.equal(push.caseSearchAddressOnly,true);
 const page=read('courts/reference/[slug]/page.tsx');
 assert.match(page,/OblastIndividualSections court=\{court\}/);
 assert.match(page,/robots:\{index:false,follow:true\}/);
 const sections=read('_components/oblast-individual-sections.tsx');
 for(const id of ['oblast-staff','oblast-filing','oblast-jurisdiction','oblast-fees','oblast-local-cases','oblast-sources'])assert.ok(sections.includes('id="'+id+'"'));
 assert.match(sections,/результат пересмотра не проверен/);
 assert.match(sections,/не означает отсутствия дел/);
});
