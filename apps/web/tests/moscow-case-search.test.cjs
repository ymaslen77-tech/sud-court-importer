/* Moscow case search behavioral checks using the real TypeScript matcher. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
function compile(file) {
 const source=fs.readFileSync(path.join(__dirname,'../app/lib',file),'utf8');
 const result=ts.transpileModule(source,{fileName:file,compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,strict:true
 },reportDiagnostics:true});
 assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length||0,0);
 const mod={exports:{}};
 new Function('require','module','exports',result.outputText)(()=>{throw Error('Unexpected runtime import');},mod,mod.exports);
 return mod.exports;
}
const search=compile('moscow-cases-search.ts');
const {MOSCOW_CASE_TOPICS}=compile('moscow-case-topics.ts');
const labor=MOSCOW_CASE_TOPICS.find(t=>t.id==='labor');
const family=MOSCOW_CASE_TOPICS.find(t=>t.id==='family');
const fraud=MOSCOW_CASE_TOPICS.find(t=>t.id==='fraud');
const credit=MOSCOW_CASE_TOPICS.find(t=>t.id==='credit');
const other=MOSCOW_CASE_TOPICS.find(t=>t.id==='other');
assert.ok(labor&&family&&fraud&&credit);
for(const q of ['увольнение','увольнении','уволили','восстановление','зарплата','трудовые споры']){
 assert.equal(search.topicMatchesSearch(labor,q),true,q);
}
assert.equal(search.topicMatchesSearch(family,'алименты'),true);
assert.equal(search.topicMatchesSearch(fraud,'мошенничество'),true);
assert.equal(search.topicMatchesSearch(credit,'кредит'),true);
assert.equal(search.topicMatchesSearch(labor,'алименты'),false);
assert.equal(search.topicMatchesSearch(labor,'02-5195/2026'),false);
assert.equal(search.topicMatchesSearch(other,'увольнение'),false);
const d1={number:'02-5195/2026',subject:'Спор по договору долевого строительства',disposition:'Удовлетворены частично'};
const d2={number:'02-2100/2026',subject:'Незаконное увольнение и восстановление на работе',disposition:'Иск удовлетворён'};
const d3={number:'02-2101/2026',subject:'Взыскание невыплаченной заработной платы',disposition:'Иск удовлетворён'};
assert.equal(search.caseMatchesSearch(d1,'02-5195/2026'),true);
assert.equal(search.caseMatchesSearch(d2,'увольнение'),true);
assert.equal(search.caseMatchesSearch(d3,'увольнение'),false);
assert.equal(search.caseMatchesSearch(d1,'алименты'),false);
assert.equal(search.caseMatchesSearch(d2,'несуществующее'),false);
// The screenshot scenario: "увольнение" must show a labor section even when no real dismissal case exists.
const onlyWages=search.collectSearchMatches(labor,'увольнение',[d3],[]);
assert.equal(onlyWages.matched,true);
assert.equal(onlyWages.matchedTopic,true);
assert.equal(onlyWages.exactDecidedCount,0);
assert.equal(onlyWages.decidedMatches.length,0);
assert.equal(onlyWages.allDecidedCount,1);
const trueDismissal=search.collectSearchMatches(labor,'увольнение',[d2,d3],[]);
assert.equal(trueDismissal.exactDecidedCount,1);
assert.deepEqual(trueDismissal.decidedMatches.map(d=>d.number),['02-2100/2026']);
const byNumber=search.collectSearchMatches(other,'02-5195/2026',[d1],[]);
assert.equal(byNumber.matched,true);
assert.equal(byNumber.matchedTopic,false);
assert.equal(byNumber.exactDecidedCount,1);
const unrelated=search.collectSearchMatches(family,'увольнение',[],[]);
assert.equal(unrelated.matched,false);
const broad=search.collectSearchMatches(labor,'трудовые',[d2,d3],[]);
assert.equal(broad.matchedTopic,true);
assert.equal(broad.broadTopic,true);
assert.equal(broad.decidedMatches.length,2);
assert.equal(search.normalizeCaseQuery('  МОШЕННИЧЕСТВО Ёж  '),'мошенничество еж');

const explorer=fs.readFileSync(path.join(__dirname,'../app/_components/moscow-cases-explorer.tsx'),'utf8');
const page=fs.readFileSync(path.join(__dirname,'../app/courts/moscow/[slug]/page.tsx'),'utf8');
for(const phrase of ['defaultOpen={searching}','moscow-case-topic-matched','matchedCases===0',
 'matchedTopic','<Highlight','Другие дела этой категории','topic.allDecidedCount',
 'setSearch(term)','role="status"','case_service_url']){
 assert.ok(explorer.includes(phrase),'Explorer search behavior is missing: '+phrase);
}
assert.ok(page.includes('<MoscowCasesExplorer court={c} decisions={adjudicatedCasesFor(c.slug)}/>'));
console.log('PASS: keyword topic discovery, automatic expansion, highlighted category, distinct case matches and accurate empty states.');
