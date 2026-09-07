import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');

test('Textilien, Aufkleber und beide Listen können als PNG gespeichert werden',()=>{
 assert.match(app,/function downloadPriceListImage\(mode\)/);
 assert.match(app,/price-list-image','textiles'/);
 assert.match(app,/price-list-image','stickers'/);
 assert.match(app,/price-list-image','both'/);
 assert.match(app,/canvas\.toBlob/);
 assert.match(app,/image\/png/);
});

test('der PNG-Export enthält nur Preislistenabschnitte',()=>{
 assert.match(app,/priceListImageSections/);
 assert.match(app,/state\.textilePriceList/);
 assert.match(app,/state\.stickerPriceList/);
 assert.doesNotMatch(app,/priceListImageSections[\s\S]{0,500}state\.customers/);
});
