import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.HP67_PLAYWRIGHT || 'playwright');
const engine=process.env.HP67_BROWSER || 'chromium';
const root=new URL('../dist/',import.meta.url),output=new URL('../data/qa/',import.meta.url);
await mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname.replace(/^\/HP67-Preis-Kalkulator\//,'') || 'index.html';
  if(!['index.html','app.js','style.css','core.mjs','browser-storage.mjs','price-list-image.mjs','initial-state.json'].includes(name)){res.writeHead(404);res.end();return;}
  const type=name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':name.endsWith('.json')?'application/json':'text/javascript';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(await readFile(new URL(name,root)));
 }catch{res.writeHead(500);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/HP67-Preis-Kalkulator/`;
let browser;
try{
 browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{channel:'msedge'}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.setDefaultTimeout(12000);
 const nav=async name=>{await page.locator(`[data-nav="${name}"]`).click();};
 const field=name=>page.locator(`#modal-form [name="${name}"]`);
 const save=async()=>{await page.locator('#modal-form button[type=submit]').click();await page.locator('#dialog').waitFor({state:'hidden'});};
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')));
 const download=async(selector,name)=>{const event=page.waitForEvent('download');await page.locator(selector).click();const result=await event;const path=new URL(`${engine}-${name}`,output);await result.saveAs(fileURLToPath(path));return path;};
 await page.goto(url);await page.locator('[data-nav="overview"]').waitFor();
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  for(const view of ['overview','planner','products','textiles','stickers','calculator','customers','quotes','invoices','settings','catalog']){
   if(view==='overview'&&await page.locator('[data-action="go-overview"]').count())await page.locator('[data-action="go-overview"]').click();
   await nav(view);
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('#content .panel, #content .page-head, #content .stat, #content .calendar-grid, #content .field, #content .calc-result')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1;}).map(el=>({class:el.className,right:el.getBoundingClientRect().right,parent:el.parentElement.className,parentWidth:el.parentElement.getBoundingClientRect().width,columns:getComputedStyle(el.parentElement).gridTemplateColumns,minWidth:getComputedStyle(el).minWidth})));
   assert.deepEqual(overflow,[],`${engine} ${width}px ${view}: overflowing layout`);
   if(view==='planner'&&width===390)await page.locator('.calendar-panel').screenshot({path:fileURLToPath(new URL(`${engine}-mobile-planner.png`,output))});
  }
  await page.locator('[data-action="go-overview"]').click();
 }
 console.log(`${engine}: all 11 screens fit desktop, 390px and 320px`);
 await page.setViewportSize({width:1440,height:1000});
 await nav('textiles');
 for(const mode of ['textiles','both']){
  const file=await download(`[data-action="price-list-image"][data-id="${mode}"]`,`${mode}.png`);
  const bytes=await readFile(file);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.readUInt32BE(20)>1000);
 }
 await page.locator('[data-action="print"]').click();
 await page.evaluate(()=>{window.print=()=>{};});
 await page.locator('[data-action="confirm-print"]').click();
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('#app').isVisible(),false);
 assert.equal(await page.locator('.print-preview').isVisible(),false);
 assert.equal(await page.locator('#print-output').isVisible(),true);
 assert.equal(await page.locator('#print-output').evaluate(el=>el.scrollHeight<=el.clientHeight+2),true);
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await page.emulateMedia({media:'screen'});
 const html=await download('[data-action="download-print"]','price-list.html');
 const printable=await readFile(html,'utf8');assert.match(printable,/3,50/);assert.match(printable,/4,50/);assert.match(printable,/<style>/);assert.doesNotMatch(printable,/href=".*style.css/);
 await page.locator('[data-action="close"]').click();
 await nav('stickers');await download('[data-action="price-list-image"][data-id="stickers"]','stickers.png');
 await download('[data-action="price-list-image"][data-id="textiles"]','textiles-from-stickers.png');
 console.log(`${engine}: textile, sticker, combined PNG and standalone print exports pass`);
 await nav('settings');
 for(const [name,value] of Object.entries({business:'QA Firma',address:'Teststraße 1',taxNumber:'TEST-123',hourlyRate:'30',taxRate:'19'}))await page.locator(`#settings-form [name="${name}"]`).fill(value);
 await page.locator('#settings-form button').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')).settings.taxRate===19);
 await nav('textiles');await page.locator('#textile-edit-costs').click();await field('vk').fill('25');await save();assert.match(await page.locator('#textile-result').innerText(),/25,00/);
 await nav('customers');await page.locator('[data-action="new-customer"]').click();await field('name').fill('QA Kunde');await field('address').fill('Kundenstraße 2');await save();
 const customer=(await snapshot()).customers[0];
 await nav('quotes');await page.locator('[data-action="new-quote"]').click();await field('customerId').selectOption(customer.id);
 assert.equal(await page.locator('#quote-product option[value^="sticker:"]').count(),0);
 await page.locator('#quote-product').selectOption({index:1});await field('discount').fill('10');await save();
 const quote=(await snapshot()).quotes[0];assert.equal(quote.items[0].price,25);assert.equal(quote.discount,10);
 await page.locator('[data-action="view-quote"]').click();await page.locator('[data-action="invoice-from-quote"]').click();await save();
 const invoice=(await snapshot()).invoices[0];assert.equal(invoice.discount,10);assert.equal(invoice.customerName,'QA Kunde');
 await page.locator('[data-action="print-invoice"]').click();await page.locator('[data-action="close"]').click();
 await nav('invoices');await page.locator('[data-action="new-simple-invoice"]').click();await page.locator('#invoice-product').selectOption({index:1});await field('note').fill('Interne Testnotiz mit langen Angaben. '.repeat(100));await field('item-name').fill('SehrLangeArtikelbezeichnung'.repeat(10));await save();
 await download('[data-action="invoice-image"]','invoice.png');
 await nav('planner');await page.locator('[data-action="new-planner"]').first().click();await field('title').fill('QA Termin');await save();
 await page.locator('[data-action="toggle-planner"]').first().click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')).plannerItems[0].status==='Erledigt');
 console.log(`${engine}: settings, textile price sync, customer, quote, full/simple invoice and planner pass`);
 // Price basis selection must preserve original list amounts and convert using document tax.
 await nav('settings');await page.locator('[name="stickerPriceType"]').selectOption('vk-gross');await page.locator('#settings-form button').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')).stickerPriceList.priceType==='vk-gross');
 await nav('quotes');await page.locator('[data-action="new-quote"]').click();await page.locator('#quote-product').selectOption('sticker:0:0:0');
 assert.equal(await field('item-price').inputValue(),'2.93');await page.locator('[data-action="close"]').first().click();
 // Saved invoice customer snapshots survive deleting an address book entry.
 await nav('customers');await page.locator('[data-action="edit-customer"]').click();page.once('dialog',dialog=>dialog.accept());await page.locator('[data-action="delete-customer"]').click();
 await nav('invoices');await page.locator(`[data-action="view-invoice"][data-id="${invoice.id}"]`).click();await page.locator('[data-action="edit-invoice"]').click();await save();
 assert.equal((await snapshot()).invoices.find(i=>i.id===invoice.id).customerName,'QA Kunde');
 // A second tab must not overwrite changes made after it loaded.
 const stale=await context.newPage();await stale.goto(url);await stale.locator('[data-nav="settings"]').click();
 await nav('settings');await page.locator('#settings-form [name="business"]').fill('QA neuer Stand');await page.locator('#settings-form button').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')).settings.business==='QA neuer Stand');
 await stale.locator('#settings-form [name="business"]').fill('Veraltetes Fenster');await stale.locator('#settings-form button').click();await stale.locator('#settings-error').filter({hasText:'anderen Fenster'}).waitFor();
 assert.equal((await snapshot()).settings.business,'QA neuer Stand');await stale.close();
 const before=await snapshot(),imported=structuredClone(before);imported.settings.business='QA Import';
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#import-file').setInputFiles({name:'test-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')).settings.business==='QA Import');
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1-before-import'))),before);
 await download('[data-action="previous-backup"]','before-import.json');
 const publicFile=await download('[data-action="public-export"]','public.json');const publicJson=await readFile(publicFile,'utf8');assert.ok(!publicJson.includes('QA Kunde'));assert.ok(!publicJson.includes('TEST-123'));
 await page.reload();assert.equal((await snapshot()).settings.business,'QA Import');
 // Manage both invoice types directly from the overview, including on narrow phones.
 await nav('invoices');await page.setViewportSize({width:320,height:900});
 const invoiceIds=(await snapshot()).invoices.map(i=>i.id);
 for(const id of invoiceIds){
  const row=page.locator('.invoice-table tr').filter({has:page.locator(`[data-action="edit-invoice"][data-id="${id}"]`)});
  for(const action of ['view-invoice','edit-invoice','delete-invoice']){
   const bounds=await row.locator(`[data-action="${action}"]`).boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=321);
  }
  await row.locator('[data-action="edit-invoice"]').click();await field('note').fill('Bearbeitung gespeichert');await field('item-price').first().fill('12.50');await save();
  const edited=(await snapshot()).invoices.find(i=>i.id===id);assert.equal(edited.note,'Bearbeitung gespeichert');assert.equal(edited.items[0].price,12.5);
  assert.equal((await snapshot()).invoices.length,invoiceIds.length);
  await nav('invoices');
 }
 const first=invoiceIds[0];page.once('dialog',dialog=>dialog.dismiss());await page.locator(`[data-action="delete-invoice"][data-id="${first}"]`).click();assert.equal((await snapshot()).invoices.length,invoiceIds.length);
 page.once('dialog',dialog=>{assert.ok(dialog.message().includes((before.invoices.find(i=>i.id===first)).number));return dialog.accept();});
 await page.locator(`[data-action="delete-invoice"][data-id="${first}"]`).click();await page.waitForFunction(id=>!JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')).invoices.some(i=>i.id===id),first);
 await page.reload();await nav('invoices');assert.equal((await snapshot()).invoices.length,invoiceIds.length-1);
 await page.locator('[data-action="view-invoice"]').click();page.once('dialog',dialog=>dialog.accept());await page.locator('#content [data-action="delete-invoice"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hoodplaka67-private-state-v1')).invoices.length===0);
 assert.match(await page.locator('#content').innerText(),/Noch keine Rechnungen/);
 console.log(`${engine}: editing both invoice types, mobile action buttons, cancelling deletion and permanent deletion pass`);
 assert.deepEqual(errors,[]);
 console.log(`${engine}: stale tab protection, import backup, public privacy and reload persistence pass; no JavaScript errors`);
 await context.close();
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
