'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..','app');
const css=fs.readFileSync(path.join(ROOT,'readability.css'),'utf8');
const base=fs.readFileSync(path.join(ROOT,'globals.css'),'utf8');
const layout=fs.readFileSync(path.join(ROOT,'layout.tsx'),'utf8');
const page=fs.readFileSync(path.join(ROOT,'courts/moscow/page.tsx'),'utf8');
const listing=require(path.join(ROOT,'data/moscow-official-minimum-registry.json')).records;
const courts=listing.filter(x=>x.kind==='general-district');

test('global reading scale is loaded last and uses reasonable font sizes',()=>{
 assert.match(layout,/import '\.\/globals\.css';\s*import '\.\/readability\.css';/);
 assert.match(css,/body\s*\{[^}]*font-size:17px/s);
 assert.match(css,/\.page-shell h1\s*\{[^}]*clamp\(/s);
 assert.match(css,/\.page-shell h2\s*\{[^}]*clamp\(/s);
 assert.match(css,/\.page-shell :is\(p,li,dd,summary,label,blockquote\)\s*\{[^}]*1rem/s);
 assert.match(css,/--reading-width:78ch/);
 assert.match(css,/\.main-nav a\s*\{[^}]*font-size:14px/s);
 assert.match(css,/\.page-shell \.court-source\s*\{[^}]*max-width:86ch/s);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(base,/\.court-section\{/);
});
test('keyboard navigation and touch targets remain available',()=>{
 assert.match(layout,/className="skip-link" href="#main-content"/);
 assert.match(layout,/<main id="main-content"/);
 assert.match(css,/\.skip-link:focus\{transform:translateY\(0\)\}/);
 assert.match(css,/summary:focus-visible/);
 assert.match(css,/\.main-nav a\s*\{[^}]*min-height:44px/s);
 assert.match(css,/\.page-shell \.court-toc a\s*\{[^}]*min-height:46px/s);
});
test('Moscow district cards are split into exhaustive, exclusive alphabetic groups',()=>{
 assert.equal(courts.length,35);
 const groups=[
  courts.filter(c=>c.name.localeCompare('Л','ru')<0),
  courts.filter(c=>c.name.localeCompare('Л','ru')>=0&&c.name.localeCompare('С','ru')<0),
  courts.filter(c=>c.name.localeCompare('С','ru')>=0)
 ];
 const all=groups.flat();
 assert.equal(all.length,35);
 assert.equal(new Set(all.map(x=>x.slug)).size,35);
 assert.ok(groups.every(x=>x.length>0));
 assert.match(page,/const districtGroups=\[/);
 assert.match(page,/sortedDistrict=\[\.\.\.district\]\.sort/);
 assert.match(page,/className="moscow-directory-jump"/);
 assert.match(page,/className="moscow-directory-groups"/);
 assert.match(page,/group\.courts\.map\(c=><Link/);
 assert.match(page,/className="result-row moscow-registry-result"/);
 assert.match(css,/\.moscow-directory-group \.results\s*\{[^}]*grid-template-columns:repeat\(2/s);
 assert.match(css,/@media\(max-width:700px\)\s*\{[^}]*\.moscow-directory-group \.results\{grid-template-columns:1fr\}/s);
});
test('presentation changes preserve the legal review and primary sources',()=>{
 assert.match(page,/robots:moscowDistrictSeoRobots\(\)/);
 assert.match(page,/MOSCOW_DIRECTORY_META\.roster_url/);
 assert.match(page,/MOSCOW_DIRECTORY_META\.source_url/);
 assert.match(layout,/className="site-footer"/);
 assert.doesNotMatch(css,/!important/);
});
