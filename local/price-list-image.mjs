const money = value => value == null ? 'Preis offen' : new Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR'}).format(value);
export const priceTypeLabels = {
  'unconfirmed':'Netto / Brutto noch ungeklärt',
  'vk-tax-unconfirmed':'Netto / Brutto noch ungeklärt',
  'vk-net':'Verkaufspreise netto',
  'vk-gross':'Verkaufspreise brutto / Endpreise',
  'ek':'Einkaufspreise · nur intern'
};

export function priceListImageSections(state, mode) {
  if (!['textiles','stickers','both'].includes(mode)) throw Error('Ungültige Preislistenauswahl.');
  const sections = [];
  const textiles = state.textilePriceList;
  if (textiles && (mode === 'textiles' || mode === 'both')) {
    const note = `${priceTypeLabels[textiles.priceType]} · Preise pro Stück.`;
    for (const entry of textiles.entries) sections.push({
      kind:'Textilien', title:entry.name, note, headers:['Ausführung','Preis'],
      rows:entry.options.map(option => [option.label, option.review ? `${money(option.price)} · Gesamtpreis / Aufpreis ungeklärt` : money(option.price)])
    });
    sections.push({kind:'Textilien', title:'Zusätzliche Motive · Aufpreise',
      note:`${priceTypeLabels[textiles.priceType]} · Zusätzlich zur gewählten Grundausführung.`,
      headers:['Zusätzliches Motiv','Aufpreis'],
      rows:textiles.additionalMotifSurcharges.map(surcharge => [surcharge.label, money(surcharge.price)])});
  }
  if (state.stickerPriceList && (mode === 'stickers' || mode === 'both')) {
    const list = state.stickerPriceList;
    for (const format of list.formats) {
      const quantities = [...new Set(format.variants.flatMap(variant => variant.tiers.map(tier => tier.quantity)))].sort((a,b) => a-b);
      sections.push({kind:'Aufkleber', title:format.format,
        note:`${priceTypeLabels[list.priceType]} · Gesamtpreise für die angegebene Stückzahl.`,
        headers:['Material', ...quantities.map(quantity => `${quantity} Stk.`)],
        rows:format.variants.map(variant => [variant.material, ...quantities.map(quantity => {
          const tier = variant.tiers.find(row => row.quantity === quantity);
          return tier ? money(tier.total) : '—';
        })])});
    }
  }
  return sections;
}

export function canvasTextLines(ctx, value, maxWidth) {
  const lines = [];
  for (const paragraph of String(value ?? '').split('\n')) {
    let line = '';
    for (const char of paragraph) {
      if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line.trimEnd()); line = ''; }
      line += char;
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

export const pricePage = {width:1200, height:1697, scale:2, padding:55, top:160, bottom:1620};
export function priceListPages(ctx, sections) {
  const pages = [[]];
  let y = pricePage.top;
  const newPage = () => { pages.push([]); y = pricePage.top; };
  for (const section of sections) {
    const widths = section.headers.length === 2 ? [730,360] : [250,...section.headers.slice(1).map(() => 840/(section.headers.length-1))];
    ctx.font='700 28px Arial';const title=canvasTextLines(ctx,section.title,1058);
    ctx.font='20px Arial';const note=canvasTextLines(ctx,section.note,1058);
    const rows=[section.headers,...section.rows].map((row,index)=>{
      ctx.font=index?'20px Arial':'700 18px Arial';
      const cells=row.map((cell,i)=>canvasTextLines(ctx,cell,widths[i]-28));
      return {cells,height:Math.max(50,Math.max(...cells.map(cell=>cell.length))*27+20)};
    });
    const headingHeight=30+title.length*35+note.length*27+14;
    const header=rows.shift();
    const capacity=pricePage.bottom-pricePage.top-headingHeight-header.height;
    if(capacity<60)throw Error('Eine Überschrift ist zu lang für eine Preislistenseite. Bitte die Bezeichnung kürzen.');
    // Split unusually long rows without dropping any cell text.
    const maxLines=Math.floor((capacity-20)/27),body=[];
    for(const row of rows){
      const lineCount=Math.max(...row.cells.map(cell=>cell.length));
      for(let offset=0;offset<lineCount;offset+=maxLines){
        const cells=row.cells.map(cell=>cell.slice(offset,offset+maxLines));
        body.push({cells,height:Math.max(50,Math.max(...cells.map(cell=>cell.length))*27+20)});
      }
    }
    let pending=body.length?body:[{cells:widths.map(()=>[]),height:50}];
    let continuation=false;
    while(pending.length){
      const allHeight=headingHeight+header.height+pending.reduce((sum,row)=>sum+row.height,0);
      if(y>pricePage.top && (allHeight<=pricePage.bottom-pricePage.top ? y+allHeight>pricePage.bottom : y+headingHeight+header.height+pending[0].height>pricePage.bottom))newPage();
      const block={kind:section.kind,title,note,widths,headingHeight,rows:[header],y,continuation};
      let used=headingHeight+header.height;
      while(pending.length&&y+used+pending[0].height<=pricePage.bottom){const row=pending.shift();block.rows.push(row);used+=row.height;}
      if(block.rows.length===1)throw Error('Ein Preislistenabschnitt passt nicht auf eine Seite.');
      block.height=used;pages.at(-1).push(block);y+=used+24;
      if(pending.length){newPage();continuation=true;}
    }
  }
  return pages.filter(page=>page.length);
}

const xml = value => String(value??'').replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
export function priceListSvg(pages, title, stamp, onlyPage=null) {
  const selected=onlyPage===null?pages.map((_,i)=>i):[onlyPage];
  const pieces=[];
  const rect=(x,y,w,h,color)=>pieces.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`);
  const text=(value,x,y,size=20,weight=400,anchor='start',color='#17242b')=>pieces.push(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${color}">${xml(value)}</text>`);
  for(const [position,index] of selected.entries()){
    if(!pages[index])throw Error('Preislistenseite nicht gefunden.');
    pieces.push(`<g transform="translate(0 ${position*pricePage.height})">`);
    rect(0,0,1200,1697,'#f3f5f6');rect(0,0,1200,18,'#17242b');text('HooDPlaka67',55,72,42,700);text(title,55,112,22,700);text(stamp,1145,72,20,400,'end','#60717a');
    for(const block of pages[index]){
      let y=block.y;rect(55,y,1090,block.height,'#fff');y+=36;
      for(const line of block.title){text(line,71,y,28,700);y+=35;}
      for(const line of block.note){text(line,71,y,20,400,'start','#52636c');y+=27;}
      y=block.y+block.headingHeight;
      for(const [rowIndex,row] of block.rows.entries()){
        rect(55,y,1090,row.height,rowIndex?'#fff':'#e9eef0');let x=55;
        row.cells.forEach((lines,i)=>{const tx=i?x+block.widths[i]-14:x+14;lines.forEach((line,j)=>text(line,tx,y+31+j*27,rowIndex?20:18,rowIndex?400:700,i?'end':'start'));x+=block.widths[i];});
        y+=row.height;rect(55,y-1,1090,1,'#dde4e7');
      }
    }
    text('Preisart und Mengeneinheit stehen bei jedem Abschnitt.',55,1664,18,400,'start','#60717a');text(`Seite ${index+1} / ${pages.length}`,1145,1664,18,400,'end','#60717a');pieces.push('</g>');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${selected.length*pricePage.height}" viewBox="0 0 1200 ${selected.length*pricePage.height}" font-family="Arial, sans-serif"><title>${xml(title)}</title>${pieces.join('')}</svg>`;
}

// Standard ZIP with stored PNG entries: PNG already has its own compression.
export async function zipPriceImages(files) {
  const encoder=new TextEncoder(),local=[],central=[];let offset=0;
  const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;};
  for(const file of files){
    const name=encoder.encode(file.name),bytes=new Uint8Array(await file.blob.arrayBuffer()),crc=crc32(bytes);
    const header=new Uint8Array(30+name.length),view=new DataView(header.buffer);
    view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);view.setUint16(12,33,true);view.setUint32(14,crc,true);view.setUint32(18,bytes.length,true);view.setUint32(22,bytes.length,true);view.setUint16(26,name.length,true);header.set(name,30);local.push(header,bytes);
    const record=new Uint8Array(46+name.length),recordView=new DataView(record.buffer);
    recordView.setUint32(0,0x02014b50,true);recordView.setUint16(4,20,true);recordView.setUint16(6,20,true);recordView.setUint16(8,0x800,true);recordView.setUint16(14,33,true);recordView.setUint32(16,crc,true);recordView.setUint32(20,bytes.length,true);recordView.setUint32(24,bytes.length,true);recordView.setUint16(28,name.length,true);recordView.setUint32(42,offset,true);record.set(name,46);central.push(record);offset+=header.length+bytes.length;
  }
  const end=new Uint8Array(22),view=new DataView(end.buffer);view.setUint32(0,0x06054b50,true);view.setUint16(8,files.length,true);view.setUint16(10,files.length,true);view.setUint32(12,central.reduce((sum,row)=>sum+row.length,0),true);view.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:'application/zip'});
}
