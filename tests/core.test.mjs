import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, initialState, productsFromTextilePriceList, quoteTotals, validateState } from '../local/core.mjs';
test('Offene Kosten bleiben offen, Nullkosten sind erlaubt',()=>{
 const s=initialState();assert.equal(calculate(s.products[0],s.settings).cost,null);
 const p={ek:0,finishing:0,minutes:0,packaging:0,other:0,markup:30,vk:null};
 assert.deepEqual(calculate(p,s.settings),{complete:true,cost:0,suggested:0,net:0,gross:null,profit:0,margin:null});
});
test('Arbeitszeit, Aufschlag, Marge und Umsatzsteuer',()=>{
 const p={ek:10,finishing:2,minutes:15,packaging:1,other:2,markup:50,vk:null};
 const c=calculate(p,{hourlyRate:40,taxRate:19});assert.equal(c.cost,25);assert.equal(c.net,37.5);assert.equal(c.gross,44.63);assert.equal(c.profit,12.5);assert.equal(c.margin,33.33);
 p.vk=20;assert.equal(calculate(p,{hourlyRate:40,taxRate:0}).profit,-5);
});
test('Eigener VK trotz offener Kosten, fehlender Stundensatz',()=>{
 const p=initialState().products[0];p.vk=12.5;const c=calculate(p,{hourlyRate:null,taxRate:19});assert.equal(c.net,12.5);assert.equal(c.gross,14.88);assert.equal(c.profit,null);
 Object.assign(p,{ek:0,finishing:0,minutes:1,packaging:0,other:0});assert.equal(calculate(p,{hourlyRate:null,taxRate:0}).cost,null);
});
test('Angebot rundet Positionen, Rabatt und Steuer in Reihenfolge',()=>{
 const q={items:[{price:0.335,quantity:3},{price:12.5,quantity:2}],discount:10,taxRate:19};
 assert.deepEqual(quoteTotals(q),{subtotal:26.01,discount:2.6,net:23.41,tax:4.45,gross:27.86});
 assert.equal(quoteTotals({...q,taxRate:null}).gross,null);
});
test('Importprüfung lehnt ungültige und doppelte Datensätze ab',()=>{
 assert.doesNotThrow(()=>validateState(initialState()));
 let s=initialState();s.products[0].ek=-1;assert.throws(()=>validateState(s));
 s=initialState();s.products[0].ek='12';assert.throws(()=>validateState(s));
 s=initialState();s.settings.taxRate=101;assert.throws(()=>validateState(s));
 s=initialState();s.products[1].id=s.products[0].id;assert.throws(()=>validateState(s));
});
test('Ein frischer Start kann alle öffentlichen Textilprodukte erzeugen',async()=>{
 const {readFile}=await import('node:fs/promises');const list=JSON.parse(await readFile(new URL('../local/textile-prices.json',import.meta.url),'utf8'));
 const products=productsFromTextilePriceList(list);assert.equal(products.length,61);assert.equal(products.every(p=>p.ek===null&&p.supplier===''&&p.vk!==null),true);
});
