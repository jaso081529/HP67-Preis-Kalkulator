import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,invoiceTotals,publicCatalog,validateState} from '../local/core.mjs';
const base={id:'r1',type:'Einfach',number:'RE-2026-001',issueDate:'2026-09-06',serviceDate:'2026-09-06',dueDate:'',status:'Entwurf',customerId:'',customerName:'',customerAddress:'',note:'Intern',taxRate:0,discount:0,items:[{name:'Großauftrag',unit:'Stück',quantity:1000,price:20}]};
test('Einfache interne Rechnungen haben keine Betragsgrenze',()=>{
 const state=initialState();state.invoices=[base];assert.doesNotThrow(()=>validateState(state));assert.equal(invoiceTotals(base).gross,20000);
});
test('Komplette Rechnung berechnet Rabatt und Steuer',()=>{
 const invoice={...base,type:'Komplett',status:'Offen',customerId:'c1',customerName:'Firma\nMax Mustermann',customerAddress:'Musterstraße 1',dueDate:'2026-09-20',taxRate:19,discount:10};
 assert.deepEqual(invoiceTotals(invoice),{subtotal:20000,discount:2000,net:18000,tax:3420,gross:21420});
 const state=initialState();state.invoices=[invoice];assert.doesNotThrow(()=>validateState(state));
 const publicJson=JSON.stringify(publicCatalog(state));assert.equal(publicJson.includes('RE-2026-001'),false);assert.equal(publicJson.includes('invoices'),false);
});
test('Doppelte Rechnungsnummern und ungültige Daten werden abgelehnt',()=>{
 const state=initialState();state.invoices=[base,{...base,id:'r2'}];assert.throws(()=>validateState(state));
 state.invoices=[{...base,number:'RE-2',issueDate:'06.09.2026'}];assert.throws(()=>validateState(state));
});
