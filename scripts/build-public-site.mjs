import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {stickerPriceList} from '../local/sticker-prices.mjs';
const out=new URL('../dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const textiles=JSON.parse(await readFile(new URL('../local/textile-prices.json',import.meta.url),'utf8'));
const publicData={format:'hoodplaka67-public-prices',version:1,business:'HooDPlaka67',textiles:{priceType:textiles.priceType,note:textiles.note,additionalMotifSurcharges:textiles.additionalMotifSurcharges,entries:textiles.entries.map(({id,name,options})=>({id,name,options:options.filter(option=>option.price!==null).map(({label,price})=>({label,price}))}))},stickers:stickerPriceList};
await Promise.all(['index.html','app.js','style.css'].map(file=>copyFile(new URL(`../public-site/${file}`,import.meta.url),new URL(file,out))));
await writeFile(new URL('prices.json',out),JSON.stringify(publicData,null,2));
console.log(`Öffentliche Seite erstellt: ${publicData.textiles.entries.length} Textilartikel, ${publicData.stickers.formats.length} Aufkleberformate.`);
