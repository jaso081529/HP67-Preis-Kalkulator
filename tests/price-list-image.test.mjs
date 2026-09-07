import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {priceListImageSections,canvasTextLines} from '../local/price-list-image.mjs';
import {stickerPriceList} from '../local/sticker-prices.mjs';

const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const textilePriceList=JSON.parse(await readFile(new URL('../local/textile-prices.json',import.meta.url),'utf8'));

test('PNG enthält alle Textilien, Mengenpreise und Motivaufpreise mit Preisbasis',()=>{
 const sections=priceListImageSections({textilePriceList,stickerPriceList},'both');
 assert.equal(sections.length,27+1+9);
 const motifs=sections.find(s=>s.title==='Zusätzliche Motive · Aufpreise');
 assert.match(JSON.stringify(motifs),/3,50/);assert.match(JSON.stringify(motifs),/4,50/);
 assert.match(motifs.note,/netto/);
 const stickers=sections.filter(s=>s.kind==='Aufkleber');
 for(const section of stickers){assert.match(section.note,/Netto \/ Brutto noch ungeklärt/);assert.match(section.note,/Gesamtpreise/);}
 assert.equal(stickers.reduce((sum,s)=>sum+s.rows.reduce((n,row)=>n+row.slice(1).filter(cell=>cell!=='—').length,0),0),141);
});
test('Ungeklärte Textilpreise bleiben im PNG sichtbar und lange Texte erhalten',()=>{
 const list=structuredClone(textilePriceList);list.entries[0].options[0].price=null;list.entries[0].options[0].review=true;
 assert.match(priceListImageSections({textilePriceList:list},'textiles')[0].rows[0][1],/Preis offen/);
 const text='LangerArtikelnameOhneLeerzeichen';
 const lines=canvasTextLines({measureText:t=>({width:t.length*10})},text,80);
 assert.equal(lines.join(''),text);assert.ok(lines.every(line=>line.length<=8));
});

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
