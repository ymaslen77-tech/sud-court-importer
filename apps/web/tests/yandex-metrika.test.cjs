'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
test('Yandex Webmaster file contains the exact verification token',()=>{
 const html=fs.readFileSync(path.join(root,'public/yandex_5753a0802bae4afa.html'),'utf8');
 assert.match(html,/<body>Verification: 5753a0802bae4afa<\/body>/);
});
test('Metrika counter is mounted once in the shared layout',()=>{
 const layout=fs.readFileSync(path.join(root,'app/layout.tsx'),'utf8');
 const component=fs.readFileSync(path.join(root,'app/_components/yandex-metrika.tsx'),'utf8');
 assert.equal((layout.match(/<YandexMetrika\s*\/>/g)||[]).length,1);
 assert.match(component,/https:\/\/mc\.yandex\.ru\/metrika\/tag\.js\?id=114727256/);
 assert.match(component,/ym\(114727256, 'init'/);
 assert.match(component,/strategy="afterInteractive"/);
 assert.match(component,/pathname\.startsWith\('\/editor\/'\)/);
});
