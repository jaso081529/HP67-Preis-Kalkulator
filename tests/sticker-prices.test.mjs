import test from 'node:test';
import assert from 'node:assert/strict';
import { stickerPriceList } from '../local/sticker-prices.mjs';
import { initialState, validateState } from '../local/core.mjs';
test('Aufkleberliste enthält 9 Formate, 33 Varianten und 141 Gesamtpreise',()=>{
 assert.equal(stickerPriceList.formats.length,9);
 assert.equal(stickerPriceList.formats.flatMap(f=>f.variants).length,33);
 assert.equal(stickerPriceList.formats.flatMap(f=>f.variants.flatMap(v=>v.tiers)).length,141);
 assert.equal(stickerPriceList.priceType,'unconfirmed');
 assert.doesNotThrow(()=>validateState({...initialState(),stickerPriceList}));
});
test('Mengen und Paketpreise bleiben exakt, auch bei ungewöhnlichem Staffelverlauf',()=>{
 const tier=(format,material,quantity)=>stickerPriceList.formats.find(f=>f.format===format).variants.find(v=>v.material===material).tiers.find(t=>t.quantity===quantity).total;
 assert.equal(tier('A3','Glossy',20),49.99);
 assert.equal(tier('A4','Holographic',5),18.4);
 assert.equal(tier('A5','Weiß Matt',4),4.5);
 assert.equal(tier('A7','Glossy',80),9.8);
 assert.equal(tier('9,5 × 9,5 cm','Transparent',30),9.2);
 assert.equal(tier('6,5 × 6,5 cm','Holographic',24),6.99);
 assert.equal(tier('20 × 5 cm','Transparent',10),4.7);
 assert.equal(tier('7 × 5 cm','Glossy',150),13.99);
 assert.equal(tier('10 × 3 cm','Transparent',180),21.99);
});
test('Ungültige Staffelpreise werden bei Sicherungsimport abgelehnt',()=>{
 const s={...initialState(),stickerPriceList:structuredClone(stickerPriceList)};
 const tiers=s.stickerPriceList.formats[0].variants[0].tiers;
 tiers[1].quantity=1;assert.throws(()=>validateState(s));tiers[1].quantity=2;
 tiers[0].total=-1;assert.throws(()=>validateState(s));tiers[0].total=3.49;
 s.stickerPriceList.priceType='netto-vielleicht';assert.throws(()=>validateState(s));
});
