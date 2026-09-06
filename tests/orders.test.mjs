import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initialState, validateState } from '../local/core.mjs';

const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');

test('Angebote speichern mehrere unterschiedliche Bestellpositionen', () => {
  const state=initialState();
  state.quotes=[{id:'q1',number:'A-1',date:'2026-09-06',validUntil:'',status:'Entwurf',customerName:'',customerAddress:'',note:'',customerId:'',taxRate:0,discount:0,items:[
    {name:'T-Shirt · XL',unit:'Stück',quantity:1,price:17},
    {name:'T-Shirt Schwarz · XXL',unit:'Stück',quantity:1,price:19.99},
    {name:'Aufkleber-Pack · A5 · Glossy · 10 Stück',unit:'Pack',quantity:2,price:10.5}
  ]}];
  assert.doesNotThrow(()=>validateState(state));
});

test('Produktvarianten und Aufkleber-Packs stehen in Angeboten und Rechnungen bereit', () => {
  assert.match(app, /function orderChoices\(/);
  assert.match(app, /group:'Aufkleber-Packs'/);
  assert.match(app, /Aufkleber-Pack · \$\{format\.format\}/);
  assert.match(app, /addOrderChoice\('#quote-product','#quote-items'\)/);
  assert.match(app, /addOrderChoice\('#invoice-product','#invoice-items'\)/);
});
