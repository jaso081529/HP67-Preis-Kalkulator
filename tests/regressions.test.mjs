import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,validateState,listPriceNet,syncTextilePrices,productsFromTextilePriceList,publicCatalog} from '../local/core.mjs';
import {stickerPriceList} from '../local/sticker-prices.mjs';
test('Nur bestätigte Verkaufspreise werden als Netto-Positionen übernommen',()=>{
 assert.equal(listPriceNet(11.90,'vk-gross',19),10);
 assert.equal(listPriceNet(11.90,'vk-net',null),11.90);
 for(const kind of ['unconfirmed','ek',undefined])assert.equal(listPriceNet(11.90,kind,19),null);
 assert.equal(listPriceNet(11.90,'vk-gross',null),null);
});
test('Geänderte Produktpreise und Motivaufpreise erscheinen in der Textilliste',()=>{
 const state=initialState();state.textilePriceList=JSON.parse(readFileSync(new URL('../local/textile-prices.json',import.meta.url)));
 state.products=productsFromTextilePriceList(state.textilePriceList);
 state.products[0].vk=22;state.products.find(p=>p.id==='textile-surcharge-small').vk=5;
 syncTextilePrices(state);
 assert.equal(state.textilePriceList.entries[0].options[0].price,22);
 assert.equal(state.textilePriceList.additionalMotifSurcharges.find(s=>s.id==='small').price,5);
});
test('Einkaufs-Preislisten erscheinen nicht im öffentlichen Export',()=>{
 const state=initialState();state.stickerPriceList={...structuredClone(stickerPriceList),priceType:'ek'};
 assert.equal(publicCatalog(state).stickers,null);
});
test('Unmögliche Kalenderdaten und doppelte Rechnungs-IDs werden abgewiesen',()=>{
 const state=initialState();state.plannerItems=[{id:'a',title:'Termin',date:'2026-02-30',time:'',type:'Termin',priority:'Normal',status:'Offen',notes:''}];
 assert.throws(()=>validateState(state),/Datum/);state.plannerItems=[];
 const invoice={id:'i',type:'Einfach',number:'1',issueDate:'2026-09-07',serviceDate:'2026-09-07',dueDate:'',status:'Entwurf',customerId:'',customerName:'',customerAddress:'',note:'',taxRate:0,discount:0,items:[{name:'A',price:1,quantity:1,unit:'Stück'}]};
 state.invoices=[invoice,{...invoice,number:'2'}];assert.throws(()=>validateState(state),/eindeutig/);
 state.invoices=[{...invoice,issueDate:'2026-02-30'}];assert.throws(()=>validateState(state),/datum/);
});
