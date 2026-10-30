// Exhaustive test of the real TypeScript decision function: every combination of
// six answers, including unanswered states, and 18 unique official-source outcomes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const {createRequire}=require('node:module');

const filename=path.resolve(__dirname,'../app/_components/constitutional-complaint-selfcheck.tsx');
const source=fs.readFileSync(filename,'utf8');
const compiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}
}).outputText;
const moduleInstance={exports:{}};
const importer=createRequire(filename);
const run=new Function('require','module','exports',compiled);
run(importer,moduleInstance,moduleInstance.exports);
const {assess,QUESTIONS}=moduleInstance.exports;

assert.equal(QUESTIONS.length,6);
assert.equal(typeof assess,'function');
const ids=QUESTIONS.map(q=>q.id);
assert.equal(new Set(ids).size,6);
const headings=[];
for(const q of QUESTIONS){
 assert.match(q.sourceUrl,/^https:\/\/www\.ksrf\.ru\//);
 for(const answer of ['yes','no','unknown']){
  const g=q.guidance[answer];
  assert.ok(g&&g.heading.length>12&&g.action.length>25&&g.detail.length>25,
   'meaningful outcome for '+q.id+'/'+answer);
  headings.push(g.heading);
 }
}
assert.equal(new Set(headings).size,18,'all 18 answer-specific headings must differ');

const possible=[undefined,'yes','no','unknown'];
let combinations=0;
function traverse(index,answers){
 if(index===ids.length){
  combinations++;
  const count=ids.filter(id=>answers[id]).length;
  const result=assess(answers,count);
  assert.ok(result.title.length>12&&result.summary.length>40&&result.next.length>15);
  assert.ok(['idle','attention','caution','ready'].includes(result.tone));
  if(ids.some(id=>answers[id]==='no'))assert.equal(result.tone,'attention');
  else if(count===ids.length&&ids.every(id=>answers[id]==='yes'))assert.equal(result.tone,'ready');
  else if(count===ids.length)assert.equal(result.tone,'caution');
  else assert.equal(result.tone,'idle');
  return;
 }
 for(const answer of possible){
  const next={...answers};
  if(answer)next[ids[index]]=answer;
  traverse(index+1,next);
 }
}
traverse(0,{});
assert.equal(combinations,4096);
const yes=Object.fromEntries(ids.map(id=>[id,'yes']));
const scenarios=[
 ['applied','Существенное препятствие'],
 ['norm','Не определён предмет'],
 ['deadline','годичный срок'],
 ['exhaustion','исчерпание'],
 ['rights','конституционно-правовая проблема'],
 ['attachments','приложения']
];
for(const [id,expected] of scenarios){
 const a={...yes,[id]:'no'};
 assert.ok(assess(a,6).title.toLowerCase().includes(expected.toLowerCase()),id);
}
assert.ok(assess(yes,6).summary.includes('не означает признания жалобы допустимой'));
console.log('KSRF selfcheck: 4096 answer combinations valid; 18 distinct official-source recommendations and 6 risk headlines verified.');
