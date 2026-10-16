/* Test strict address jurisdiction with actual TypeScript resolver (no network). */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'../app/lib/resolve-address-jurisdiction.ts'),'utf8');
const {outputText,diagnostics}=ts.transpileModule(source,{
  fileName:'resolve-address-jurisdiction.ts',
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,strict:true},
  reportDiagnostics:true
});
assert.equal(diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length||0,0);
const module_={exports:{}};
const requireStub=id=>{
 if(id==='../data/approved-jurisdiction-addresses.json')return {schemaVersion:1,approvedRules:[]};
 if(id==='./pilot-public')return {pilotPublicCourts:()=>[
  {external_code:'54RS0012',official_header_court_name:'Барабинский районный суд',region_code:'54'},
  {external_code:'54RS0001',official_header_court_name:'Дзержинский районный суд',region_code:'54'}
 ]};
 throw Error('Unexpected module '+id);
};
new Function('require','module','exports',outputText)(requireStub,module_,module_.exports);
const {resolveAddressJurisdiction:resolve,normalizeAddress:normalize}=module_.exports;

const address='Новосибирская область, г. Барабинск, ул. Ленина, д. 5';
const req={region:'region-54',address,role:'defendant',caseKind:'civil',courtLevel:'district'};
const today=new Date().toISOString().slice(0,10);
const future=new Date(Date.now()+365*86400*1000).toISOString().slice(0,10);
const trusted={
 region:'region-54',addressKey:normalize(address),role:'defendant',
 caseKind:'civil',courtLevel:'district',courtCode:'54RS0012',
 reviewedBy:'Редактор портала',reviewedOn:today,validThrough:future,
 sourceUrl:'https://barabinsky--nsk.sudrf.ru/',status:'approved'
};
const blocked=(query,rules,expected)=>{
 const result=resolve(query,rules);
 assert.equal(result.kind,'blocked',JSON.stringify(result));
 assert.equal(result.code,expected);
 assert.equal(result.courtCode,undefined); // Never offer a best guess.
};
blocked(req,[],'verified_boundaries_missing');
blocked({...req,address:'Новосибирская область, г. Барабинск'},[],'incomplete_address');
blocked({...req,address:'Омская область, г. Омск, ул. Ленина, д. 5'},[],'region_conflict');
blocked({...req,courtLevel:'unknown'},[],'court_level_unknown');
blocked({...req,role:'applicant'},[],'address_role_conflict');
blocked({...req,caseKind:'other'},[],'case_type_unknown');
blocked({...req,address:'Новосибирская область, г. Барабинск, ул. Ленина, д. 6'},[trusted],'address_not_covered');
blocked({...req,caseKind:'economic'},[trusted],'court_level_conflict');
blocked(req,[{...trusted,sourceUrl:'https://sudrf.ru.evil.com'}],'verified_boundaries_missing');
blocked(req,[{...trusted,validThrough:'2020-01-01'}],'verified_boundaries_missing');
blocked(req,[{...trusted,courtCode:'54RS9999'}],'court_not_published');
blocked(req,[{...trusted,courtCode:'54OS0000'}],'court_level_mismatch');
blocked(req,[trusted,{...trusted,courtCode:'54RS0001'}],'ambiguous_boundaries');
blocked(req,[trusted,{...trusted,courtCode:'54RS0001',status:'pending'}],'conflicting_or_stale_evidence');
blocked(req,[trusted,{...trusted,validThrough:'2020-01-01'}],'conflicting_or_stale_evidence');
blocked({...req,address:address+', кв. 99'},[trusted],'personal_address');
const only=resolve(req,[trusted]);
assert.equal(only.kind,'resolved');
assert.equal(only.courtCode,'54RS0012');
assert.equal(only.courtUrl,'/courts/region-54/sud-54rs0012');
assert.equal(only.sourceUrl,trusted.sourceUrl);
console.log('PASS: strict jurisdiction blocked 16 invalid/unsupported cases and returned exactly one verified synthetic match.');
