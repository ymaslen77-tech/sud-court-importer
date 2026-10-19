/* Run the actual TypeScript territory resolver with synthetic, source-shaped fixtures. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'../app/lib/resolve-moscow-territory.ts'),'utf8');
const {outputText,diagnostics}=ts.transpileModule(source,{
 fileName:'resolve-moscow-territory.ts',
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,strict:true},
 reportDiagnostics:true
});
assert.equal(diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length||0,0);
const mod={exports:{}};
new Function('require','module','exports',outputText)(id=>{
 if(id==='../data/moscow-territorial-approved.json')return {schemaVersion:1,city:'Москва',approvedRules:[]};
 if(id==='./moscow-courts')return {moscowCourts:()=>[
  {slug:'lefortovskij',name:'Лефортовский районный суд города Москвы'},
  {slug:'taganskij',name:'Таганский районный суд города Москвы'}]};
 throw Error('Unexpected '+id);
},mod,mod.exports);
const {resolveMoscowTerritory:resolve,approvedMoscowStreets:streets}=mod.exports;
const today=new Date().toISOString().slice(0,10);
const future=new Date(Date.now()+86400000*100).toISOString().slice(0,10);
const input={street:'улица Тверская',house:'12',corpus:'2',structure:'',currentCourtSlug:'lefortovskij'};
const base={street:'ул. Тверская',house:'12',corpus:'2',structure:'',
 courtSlug:'lefortovskij',courtName:'Лефортовский районный суд города Москвы',
 courtOfficialUrl:'https://mos-gorsud.ru/rs/lefortovskij',
 sourceUrl:'https://mos-gorsud.ru/rs/lefortovskij/services/territorial',
 reviewedOn:today,validThrough:future,reviewedBy:'Проверивший редактор',status:'approved'};
function kind(q,r,expected,code){
 const result=resolve(q,r,today);
 assert.equal(result.kind,expected,JSON.stringify(result));
 if(code)assert.equal(result.code,code);
 return result;
}
kind(input,[],'unknown','not_covered'); // No evidence must never become a red negative
assert.deepEqual(streets([]),[]);
assert.deepEqual(streets([base]),['ул. Тверская']);
const matched=kind(input,[base],'match');
assert.equal(matched.courtName,base.courtName);
assert.equal(matched.courtUrl,'/courts/moscow/lefortovskij');
assert.equal(matched.external,false);
const second={...base,courtSlug:'taganskij',courtName:'Таганский районный суд города Москвы',
 courtOfficialUrl:'https://mos-gorsud.ru/rs/taganskij',
 sourceUrl:'https://mos-gorsud.ru/rs/taganskij/services/territorial'};
const cross=kind(input,[second],'other');
assert.equal(cross.courtUrl,'/courts/moscow/taganskij');
const other={...base,courtSlug:'tverskoj',courtName:'Тверской районный суд города Москвы',
 courtOfficialUrl:'https://mos-gorsud.ru/rs/tverskoj',
 sourceUrl:'https://mos-gorsud.ru/rs/tverskoj/services/territorial'};
const ext=kind(input,[other],'other');
assert.equal(ext.external,true);
assert.equal(ext.courtUrl,'https://mos-gorsud.ru/rs/tverskoj');
kind(input,[base,second],'unknown','conflicting_records');
kind(input,[base,{...second,status:'pending'}],'unknown','stale_or_unapproved');
kind(input,[{...base,validThrough:'2020-01-01'}],'unknown','stale_or_unapproved');
kind(input,[{...base,sourceUrl:'https://mos-gorsud.ru.evil.ru/territorial'}],'unknown','stale_or_unapproved');
kind(input,[{...base,reviewedBy:''}],'unknown','stale_or_unapproved');
kind({...input,house:'13'},[base],'unknown','not_covered');
kind({...input,corpus:''},[base],'unknown','not_covered');
kind({...input,structure:'1'},[base],'unknown','not_covered');
kind({...input,house:''},[base],'unknown','invalid_address');
kind({...input,house:'12 квартира 3'},[base],'unknown','personal_data');
kind({...input,street:'Москва'},[base],'unknown','invalid_address');
assert.equal(resolve({...input,street:'улица Тверская'},[base],today).kind,'match');
console.log('PASS: Moscow district court exact-address matching, cross-court routing, three-state evidence checks and privacy gate.');
