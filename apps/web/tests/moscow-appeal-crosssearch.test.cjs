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
const oblastCourts=oblast.records.map(x=>({
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
 '../data/moscow-oblast-appeal-index-samples.json':oblast
});
const entries=index.MOSCOW_REGION_CASES;

test('all two official Moscow appeal identifiers are indexed; only verified appellate number shown',()=>{
 assert.equal(entries.length,6);
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
   assert.equal(x.evidenceStatus,'single_official_index_snapshot');
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
 assert.match(unified,/Дата.*не является актуальным расписанием/);
 assert.match(page,/robots:\{index:false,follow:true\}/);
});
