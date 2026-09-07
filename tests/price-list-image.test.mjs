import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {priceListImageSections,canvasTextLines,priceListPages,priceListSvg,pricePage,zipPriceImages} from '../local/price-list-image.mjs';
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
test('Separate Textilien-PNG enthält ausschließlich Textilien und Motivaufpreise',()=>{
 const sections=priceListImageSections({textilePriceList,stickerPriceList},'textiles');
 assert.equal(sections.length,textilePriceList.entries.length+1);
 assert.ok(sections.every(section=>section.kind==='Textilien'));
});
test('HD-Seiten behalten alle Preise und überschreiten die Bildgrenzen nicht',()=>{
 const sections=priceListImageSections({textilePriceList,stickerPriceList},'both');
 const pages=priceListPages({measureText:text=>({width:text.length*11})},sections);
 assert.ok(pages.length>1);assert.equal(pricePage.width*pricePage.scale,2400);
 assert.ok(pricePage.width*pricePage.height*pricePage.scale**2<16000000);
 const rows=pages.flatMap(page=>page.flatMap(block=>{assert.ok(block.y+block.height<=pricePage.bottom);return block.rows.slice(1).map(row=>row.cells.map(cell=>cell.join('')));}));
 assert.deepEqual(rows,sections.flatMap(section=>section.rows));
 const svg=priceListSvg(pages,'Test <Preise>','07.09.2026');
 assert.match(svg,/Test &lt;Preise&gt;/);assert.match(svg,/<text /);assert.doesNotMatch(svg,/<image|<script/);
});
test('Zu lange Tabellen werden auf Seiten mit wiederholten Spaltenüberschriften verteilt',()=>{
 const rows=Array.from({length:100},(_,i)=>['Artikel '+i,String(i)]);
 const pages=priceListPages({measureText:text=>({width:text.length*10})},[{title:'Lange Liste',kind:'Textilien',note:'Netto',headers:['Name','Preis'],rows}]);
 assert.ok(pages.length>1);
 assert.deepEqual(pages.flatMap(page=>page.flatMap(block=>block.rows.slice(1).map(row=>row.cells.map(cell=>cell.join(''))))),rows);
 for(const page of pages)assert.deepEqual(page[0].rows[0].cells,[['Name'],['Preis']]);
});
test('ZIP enthält vollständige Dateien mit Standard-CRC und Verzeichnis',async()=>{
 const blob=await zipPriceImages([{name:'seite.png',blob:new Blob(['123456789'])}]);
 const bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer);
 assert.equal(view.getUint32(0,true),0x04034b50);assert.equal(view.getUint32(14,true),0xcbf43926);
 assert.equal(view.getUint32(18,true),9);assert.equal(new TextDecoder().decode(bytes.slice(39,48)),'123456789');
 assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);assert.equal(view.getUint16(bytes.length-12,true),1);
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
