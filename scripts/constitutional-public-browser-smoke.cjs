/* Read-only browser acceptance test of already published KSRF generators.
 * Uses SYNTHETIC data only. Never clicks any official submission/payment link.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.PUBLIC_BASE||'http://sudy-preview.79.133.181.192.sslip.io';
const root='/courts/reference/constitutional-court-rf';
const log=(label,detail)=>console.log('AUDIT '+label+': '+detail);
const fillProfile=async(page)=>{
 const fieldset=page.locator('.ksrf-document-generator fieldset').nth(0);
 await fieldset.locator('input').nth(0).fill('Тестовый Заявитель');
 await fieldset.locator('input').nth(1).fill('Тестовый адрес, не для корреспонденции');
 await fieldset.locator('input').nth(4).fill('29.10.2026');
};
const fillContent=async(page,skip=-1)=>{
 const fieldset=page.locator('.ksrf-document-generator fieldset').nth(2);
 const fields=fieldset.locator('input[type=text],textarea');
 const n=await fields.count();
 for(let i=0;i<n;i++)if(i!==skip)await fields.nth(i).fill('Синтетические сведения для браузерной проверки '+(i+1));
 return fields;
};
const go=async(page,path)=>{
 const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:40000});
 assert.equal(response?.status(),200,'HTTP 200 expected on '+path);
 log('HTTP_200',path);
};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({acceptDownloads:true,ignoreHTTPSErrors:true,locale:'ru-RU'});
 const page=await context.newPage();
 const errors=[];
 let writes=0;
 page.on('pageerror',err=>errors.push(String(err)));
 page.on('request',req=>{if(!['GET','HEAD','OPTIONS'].includes(req.method())&&req.url().includes('sudy-preview'))writes++;});
 try{
  await go(page,root);
  assert.ok((await page.locator('h1').innerText()).includes('Конституционный'));
  await go(page,root+'/documents/complaint');
  let meta=await page.locator('meta[name="robots"]').getAttribute('content');
  assert.ok(meta&&meta.includes('noindex'),'expected noindex until approval');
  log('ROBOTS_GENERATOR',meta);
  const downloadButton=page.getByRole('button',{name:'Скачать TXT'});
  assert.equal(await downloadButton.isDisabled(),true,'must block empty complaint');
  await fillProfile(page);
  await fillContent(page);
  await page.waitForTimeout(350);
  assert.equal(await downloadButton.isEnabled(),true,'valid complaint must enable TXT download');
  const preview=await page.locator('.ksrf-generator-preview pre').innerText();
  assert.ok(preview.includes('Тестовый Заявитель')&&preview.includes('Синтетические сведения'));
  log('COMPLAINT_PREVIEW','updates with filled values');
  const promise=page.waitForEvent('download');
  await downloadButton.click();
  const downloaded=await promise;
  const localPath=await downloaded.path();
  assert.equal(downloaded.suggestedFilename(),'ksrf-complaint-draft.txt');
  const raw=fs.readFileSync(localPath,'utf8');
  assert.ok(raw.includes('Тестовый Заявитель')&&raw.includes('ЖАЛОБА'));
  log('COMPLAINT_TXT','downloaded '+raw.length+' chars');
  await page.evaluate(()=>{window.__printObserved=false;window.print=()=>{window.__printObserved=true;};});
  await page.getByRole('button',{name:'Печать / сохранить PDF'}).click();
  assert.equal(await page.evaluate(()=>window.__printObserved),true);
  const pdf=await page.pdf({format:'A4',printBackground:true});
  assert.ok(pdf.length>2500&&pdf.subarray(0,4).toString()==='%PDF');
  log('PDF_PRINT','print invoked, PDF '+pdf.length+' bytes');
  await page.getByRole('button',{name:'Копировать проект'}).click();
  const message=(await page.locator('.ksrf-generator-feedback').innerText()).trim();
  log('CLIPBOARD',message);
  if(message.includes('Не удалось'))log('CLIPBOARD_WARNING','HTTP origin may not be secure; use HTTPS for copy');
  await page.getByRole('button',{name:'Очистить форму'}).click();
  assert.equal(await downloadButton.isDisabled(),true,'reset must disable export');
  log('COMPLAINT_RESET','passed');
  await go(page,root+'/documents/fee-relief');
  const feeDownload=page.getByRole('button',{name:'Скачать TXT'});
  assert.equal(await feeDownload.isDisabled(),true);
  await fillProfile(page);
  const feeFields=await fillContent(page,4);
  await page.getByRole('radio',{name:'Отсрочка'}).check();
  assert.equal(await feeDownload.isDisabled(),true,'defer requires terms');
  await feeFields.nth(4).fill('Отсрочка 30 календарных дней');
  assert.equal(await feeDownload.isEnabled(),true);
  const dp=page.waitForEvent('download');
  await feeDownload.click();
  const dd=await dp;
  assert.equal(dd.suggestedFilename(),'ksrf-fee-motion-draft.txt');
  const fee=fs.readFileSync(await dd.path(),'utf8');
  assert.ok(fee.includes('Отсрочка 30 календарных дней')&&fee.includes('ХОДАТАЙСТВО'));
  log('FEE_RELIEF_TXT','downloaded '+fee.length+' chars; deferral validated');
  await page.getByRole('button',{name:'Очистить форму'}).click();
  assert.equal(await feeDownload.isDisabled(),true);
  log('FEE_RELIEF_RESET','passed');
  for(const path of ['/practice','/positions','/effects','/resources','/practice/25-p-2026']){
   await go(page,root+path);
   const robots=await page.locator('meta[name="robots"]').getAttribute('content');
   assert.ok(robots&&robots.includes('noindex'),'noindex should remain for '+path);
  }
  const holding=await page.locator('body').innerText();
  assert.ok(holding.includes('Статья 322 ГК РФ признана не противоречащей Конституции'),
   'latest corrected holding for 25-П/2026 was not published');
  log('LATEST_HOLDING','25-П/2026 corrected result visible');
  assert.equal(writes,0,'unexpected POST/PUT or write request in testing');
  log('NO_WRITES','No public-site write requests or submissions');
  if(errors.length)throw Error('Page errors: '+errors.join(' | ').slice(0,600));
  log('RESULT','PASS. Routes, forms, downloads, PDF, SEO meta and latest case');
 }finally{await browser.close();}
})().catch(e=>{console.error('AUDIT_FAILED',e.stack||e);process.exitCode=1;});
