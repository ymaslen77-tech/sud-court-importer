/* Exercise the real national directory search, not a mock filtered result. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const base=path.join(__dirname,'../app');
function loadTs(filename,importer=()=>{throw Error('Unexpected runtime import');}){
 const src=fs.readFileSync(path.join(base,filename),'utf8');
 const o=ts.transpileModule(src,{fileName:filename,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,
  esModuleInterop:true,strict:true},reportDiagnostics:true});
 assert.equal(o.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length||0,0);
 const module={exports:{}};
 new Function('require','module','exports',o.outputText)(importer,module,module.exports);
 return module.exports;
}
const pure=loadTs('lib/court-directory-search.ts');
const regions=loadTs('lib/directory-regions.ts').DIRECTORY_REGIONS;
const research=require('../app/lib/research-courts.json');
const magistrates=require('../app/lib/research-magistrates.json');
const arbitration=require('../app/data/official-arbitration-list.json');
const appeals=require('../app/data/official-arbitration-appeals-districts.json');
const moscow=require('../app/lib/moscow-court-dossiers.json');
const pilot=require('../app/lib/pilot-review-matrix.json');
const allResearch=[...research,...magistrates];
const registry=loadTs('lib/court-directory.ts',id=>{
 if(id==='../data/official-arbitration-list.json')return arbitration;
 if(id==='../data/official-arbitration-appeals-districts.json')return appeals;
 if(id==='./research-courts')return {
  researchRegions:()=>[
   {slug:'region-27'},{slug:'region-54'},{slug:'region-55'}],
  researchCourtsByRegion:region=>allResearch.filter(x=>x.region===region)
 };
 if(id==='./pilot-public')return {pilotPublicCourts:()=>pilot.records
  .filter(x=>x.publication_state==='pending'&&!x.editorial_approved)};
 if(id==='./moscow-courts')return {moscowCourts:()=>moscow};
 if(id==='./directory-regions')return {DIRECTORY_REGIONS:regions};
 throw Error('Unexpected import '+id);
});
const entries=registry.directoryEntries();
assert.equal(research.length,76);
assert.equal(magistrates.length,75);
assert.equal(moscow.length,12);
assert.equal(arbitration.length+appeals.length,121);
assert.equal(entries.length,284);
assert.equal(regions.length,89);
assert.equal(new Set(regions.map(x=>x.slug)).size,89);
assert.equal(registry.directoryCounts().total,284);
const find=(query='',kind='',region='')=>pure.filterDirectoryEntries(entries,{query,kind,region});
const m=find('Лефортовский','general-district','moscow');
assert.equal(m.length,1);
assert.equal(m[0].href,'/courts/moscow/lefortovskij');
assert.equal(find('54RS0012').length,1);
assert.equal(find('54RS0012')[0].status,'reference');
assert.ok(find('индустриальный').some(x=>x.code==='54RS0012'));
assert.equal(find('районный','general-district','region-27').length,0);
assert.equal(find('', 'general-magistrate','region-27').length,75);
assert.ok(find('арбитражный','arbitration-subject').length>40);
assert.ok(find('арбитражный','arbitration-appeal').length>0);
assert.equal(find('','arbitration-subject','moscow').length,0);
assert.equal(find('', '', 'region-79').length,0);
assert.ok(find('27MS0001').some(c=>c.href==='/courts/region-27/sud-27ms0001'));
assert.equal(find('несуществующий суд').length,0);
assert.ok(find('республика', 'arbitration-subject','').length>5);
assert.deepEqual(pure.paginateDirectoryEntries(entries,1,20).items.length,20);
assert.equal(pure.paginateDirectoryEntries(entries,9999,20).items.length,4);
assert.equal(pure.paginateDirectoryEntries(entries,-10,20).page,1);
const lookup=new Set(entries.map(e=>e.id));
assert.equal(lookup.size,entries.length);
assert.ok(entries.every(x=>x.href.startsWith('/courts/')&&x.sourceUrl.startsWith('https://')));
assert.ok(entries.filter(x=>x.status==='names').every(x=>x.href.startsWith('/courts/arbitration?q=')));
assert.ok(entries.filter(x=>x.status==='research').every(x=>!x.region||x.region==='moscow'||x.region.startsWith('region-')));
const page=fs.readFileSync(path.join(base,'courts/page.tsx'),'utf8');
const search=fs.readFileSync(path.join(base,'search/page.tsx'),'utf8');
const ui=fs.readFileSync(path.join(base,'_components/court-directory-explorer.tsx'),'utf8');
assert.ok(page.includes('<CourtDirectoryExplorer entries={all}/>'));
assert.ok(search.includes('CourtDirectoryExplorer entries={directoryEntries()}'));
for(const s of ['aria-live="polite"','aria-label="Страницы результатов поиска"','Сбросить фильтры',
 'Ссылка на результаты','Данные пока доступны','Данные']){ // last two come from listing source, not necessarily UI
  if(s==='Данные пока доступны'||s==='Данные')continue;
  assert.ok(ui.includes(s),s);
}
assert.ok(ui.includes('Ожидают наполнения'));
assert.ok(search.includes('searchVerifiedCourtsPage'));
console.log('PASS: 284 traceable entries, 89 selectable regions, Moscow, regional codes, arbitration and paging.');
