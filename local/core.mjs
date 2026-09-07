export const categories = ['Textilien', 'Aufkleber', 'Veredelung', 'Sonstiges'];
export const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function listPriceNet(price, priceType, taxRate) {
  if (price === null || price === undefined) return null;
  if (priceType === 'vk-net') return price;
  if (priceType === 'vk-gross' && typeof taxRate === 'number') return round(price / (1 + taxRate / 100));
  return null;
}
export function syncTextilePrices(state) {
  const list = state.textilePriceList;
  if (!list || list.priceType !== 'vk-net') return;
  const products = new Map(state.products.map(product => [product.id, product]));
  for (const entry of list.entries) for (const [index, option] of entry.options.entries()) {
    const product = products.get(`${entry.id}-option-${index}`);
    if (!product) continue;
    const net = calculate(product, state.settings).net;
    if (net !== option.price) { option.price = net; option.review = net === null; option.sourceText = net === null ? 'Preis offen' : String(net); }
  }
  for (const surcharge of list.additionalMotifSurcharges) {
    const product = products.get(`textile-surcharge-${surcharge.id}`);
    if (product) {
      const net = calculate(product, state.settings).net;
      if (net === null) throw Error('Bitte für zusätzliche Motive einen Aufpreis festlegen; 0 ist erlaubt.');
      surcharge.price = net;
    }
  }
}
export function productsFromTextilePriceList(list) {
  const products=[];
  for(const entry of list.entries)for(const [index,option] of entry.options.entries())products.push({id:`${entry.id}-option-${index}`,name:entry.name,sku:'',category:entry.sourceRow===43?'Sonstiges':'Textilien',unit:'Stück',description:option.label,supplier:'',variant:option.label,ek:null,finishing:null,minutes:null,packaging:null,other:null,markup:null,vk:option.price,visible:false,notes:''});
  for(const surcharge of list.additionalMotifSurcharges.filter(s=>s.price>0))products.push({id:`textile-surcharge-${surcharge.id}`,name:surcharge.label,sku:'',category:'Veredelung',unit:'Motiv',description:'Aufpreis für ein zusätzliches Motiv',supplier:'',variant:'Aufpreis',ek:null,finishing:null,minutes:null,packaging:null,other:null,markup:null,vk:surcharge.price,visible:false,notes:''});
  return products;
}
export function calculate(p, settings) {
  const complete = ['ek', 'finishing', 'minutes', 'packaging', 'other'].every(k => typeof p[k] === 'number') && (p.minutes === 0 || typeof settings.hourlyRate === 'number');
  const cost = complete ? round(p.ek + p.finishing + p.minutes / 60 * (settings.hourlyRate || 0) + p.packaging + p.other) : null;
  const suggested = cost !== null && typeof p.markup === 'number' ? round(cost * (1 + p.markup / 100)) : null;
  const net = typeof p.vk === 'number' ? p.vk : suggested;
  const gross = net !== null && typeof settings.taxRate === 'number' ? round(net * (1 + settings.taxRate / 100)) : null;
  return { complete, cost, suggested, net, gross, profit: cost !== null && net !== null ? round(net - cost) : null, margin: cost !== null && net > 0 ? round((net - cost) / net * 100) : null };
}
export function initialState() {
  return { version: 1, revision: 0, settings: { business: 'HooDPlaka67', owner: '', address: '', email: '', phone: '', taxNumber:'', vatId:'', iban:'', bic:'', bankName:'', hourlyRate: null, taxRate: null, offerNote: '', taxNote: '' }, products: ['T-Shirt', 'Hoodie', 'Aufkleber'].map((name, i) => ({ id: `starter-${i}`, name, sku: '', category: i === 2 ? 'Aufkleber' : 'Textilien', unit: 'Stück', description: '', supplier: '', variant: '', ek: null, finishing: null, minutes: null, packaging: null, other: null, markup: null, vk: null, visible: false, notes: '' })), customers: [], quotes: [], invoices:[], plannerItems: [] };
}
const fail = message => { throw new Error(message); };
function str(v, label, max = 5000) { if (typeof v !== 'string' || v.length > max) fail(`${label}: ungültiger Text.`); }
function number(v, label, max = 1e7) { if (v !== null && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max)) fail(`${label}: ungültige Zahl.`); }
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function validateState(s) {
  if (!s || s.version !== 1 || !Number.isInteger(s.revision) || s.revision < 0 || !s.settings) fail('Ungültiges Sicherungsformat.');
  for (const k of ['business', 'owner', 'address', 'email', 'phone', 'offerNote', 'taxNote']) str(s.settings[k], k);
  for (const k of ['taxNumber','vatId','iban','bic','bankName']) if(s.settings[k]!==undefined)str(s.settings[k],k);
  if (!s.settings.business.trim()) fail('Bitte einen Firmennamen eingeben.');
  number(s.settings.hourlyRate, 'Stundensatz'); number(s.settings.taxRate, 'Umsatzsteuer', 100);
  if (s.textilePriceList !== undefined) {
    const list=s.textilePriceList;
    if(!list || !['vk-tax-unconfirmed','vk-gross','vk-net'].includes(list.priceType)) fail('Ungültige Textilien-Preisart.');
    for(const k of ['id','sourceFile','sheet','note'])str(list[k],k);
    if(!Array.isArray(list.additionalMotifSurcharges)||list.additionalMotifSurcharges.length!==3)fail('Ungültige Motivaufpreise.');
    const surchargeIds=new Set();
    for(const surcharge of list.additionalMotifSurcharges){str(surcharge.id,'Aufpreis-ID',30);str(surcharge.label,'Aufpreis-Bezeichnung',100);number(surcharge.price,'Motivaufpreis');if(!surcharge.id||surchargeIds.has(surcharge.id)||surcharge.price===null)fail('Ungültiger Motivaufpreis.');surchargeIds.add(surcharge.id);}
    if(!Array.isArray(list.entries)||list.entries.length>10000)fail('Ungültige Textilienliste.');
    const ids=new Set();
    for(const entry of list.entries){
      str(entry.id,'Artikel-ID');str(entry.name,'Artikelname');
      if(!entry.name.trim()||ids.has(entry.id))fail('Doppelter oder fehlender Textilartikel.');ids.add(entry.id);
      if(!Number.isInteger(entry.sourceRow)||entry.sourceRow<1)fail('Ungültige Quellzeile.');
      if(!Array.isArray(entry.options)||!entry.options.length||entry.options.length>100)fail('Ungültige Druckoptionen.');
      for(const option of entry.options){
        for(const k of ['label','sourceText','sourceCell'])str(option[k],k);
        number(option.price,'Textilien-VK');
        if(typeof option.review!=='boolean'||(!option.review&&option.price===null))fail('Unklarer Preis muss zur Klärung markiert sein.');
      }
    }
  }
  if (s.stickerPriceList !== undefined) {
    const list = s.stickerPriceList;
    if (!list || !['unconfirmed','vk-gross','vk-net','ek'].includes(list.priceType)) fail('Ungültige Preisart der Aufkleberliste.');
    str(list.id, 'Preislisten-ID', 100); str(list.date, 'Preislistendatum', 30);
    if (!Array.isArray(list.formats) || list.formats.length > 100) fail('Ungültige Aufkleberformate.');
    const formats = new Set();
    for (const format of list.formats) {
      str(format.format, 'Format', 100);
      if (!format.format.trim() || formats.has(format.format)) fail('Doppeltes oder fehlendes Format.'); formats.add(format.format);
      if (!Array.isArray(format.variants) || !format.variants.length || format.variants.length > 100) fail('Ungültige Materialien.');
      const materials = new Set();
      for (const variant of format.variants) {
        str(variant.material, 'Material', 100);
        if (!variant.material.trim() || materials.has(variant.material)) fail('Doppeltes oder fehlendes Material.'); materials.add(variant.material);
        if (!Array.isArray(variant.tiers) || !variant.tiers.length || variant.tiers.length > 100) fail('Ungültige Mengenstaffeln.');
        let previous = 0;
        for (const tier of variant.tiers) {
          if (!Number.isInteger(tier.quantity) || tier.quantity <= previous || tier.quantity > 1e7) fail('Stückzahlen müssen aufsteigend und eindeutig sein.');
          previous = tier.quantity; number(tier.total, 'Staffel-Gesamtpreis');
          if (tier.total === null || Math.abs(tier.total * 100 - Math.round(tier.total * 100)) > 1e-6) fail('Gesamtpreise müssen auf Cent angegeben sein.');
        }
      }
    }
  }
  for (const key of ['products', 'customers', 'quotes']) {
    if (!Array.isArray(s[key]) || s[key].length > 10000) fail(`Ungültige Daten: ${key}`);
    const ids = new Set(); for (const row of s[key]) { str(row.id, 'ID', 100); if (!row.id || ids.has(row.id)) fail('Doppelte oder fehlende ID.'); ids.add(row.id); }
  }
  for (const p of s.products) {
    for (const k of ['name', 'sku', 'category', 'unit', 'description', 'supplier', 'variant', 'notes']) str(p[k], k);
    if (!p.name.trim() || !categories.includes(p.category) || !p.unit.trim()) fail('Produktname, Kategorie und Einheit prüfen.');
    for (const k of ['ek', 'finishing', 'minutes', 'packaging', 'other', 'markup', 'vk']) number(p[k], k);
    if (typeof p.visible !== 'boolean') fail('Ungültige Produktfreigabe.');
  }
  for (const c of s.customers) { for (const k of ['name', 'company', 'email', 'phone', 'address', 'notes']) str(c[k], k); if (!c.name.trim()) fail('Kundenname fehlt.'); }
  if(s.plannerItems!==undefined){
    if(!Array.isArray(s.plannerItems)||s.plannerItems.length>10000)fail('Ungültige Planerdaten.');
    const plannerIds=new Set();
    for(const item of s.plannerItems){
      for(const k of ['id','title','date','time','type','priority','status','notes'])str(item[k],k);
      if(!item.id||plannerIds.has(item.id)||!item.title.trim())fail('Planereintrag ohne eindeutige ID oder Titel.');plannerIds.add(item.id);
      if(!validDate(item.date))fail('Ungültiges Datum im Planer.');
      if(item.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time))fail('Ungültige Uhrzeit im Planer.');
      if(!['Aufgabe','Termin','Erinnerung'].includes(item.type)||!['Normal','Wichtig','Dringend'].includes(item.priority)||!['Offen','Erledigt'].includes(item.status))fail('Ungültige Planerauswahl.');
    }
  }
  const quoteNumbers = new Set();
  for (const q of s.quotes) {
    for (const k of ['number', 'date', 'validUntil', 'status', 'customerName', 'customerAddress', 'note', 'customerId']) str(q[k], k);
    if (!q.number.trim() || quoteNumbers.has(q.number)) fail('Angebotsnummer muss eindeutig sein.'); quoteNumbers.add(q.number);
    if (!validDate(q.date) || (q.validUntil && (!validDate(q.validUntil) || q.validUntil < q.date))) fail('Angebotsdatum oder Gültigkeitsdatum prüfen.');
    if (!['Entwurf', 'Angeboten', 'Angenommen', 'Abgelehnt'].includes(q.status)) fail('Ungültiger Angebotsstatus.');
    number(q.taxRate, 'Umsatzsteuer', 100); number(q.discount, 'Rabatt', 100);
    if (q.discount === null || !Array.isArray(q.items) || !q.items.length || q.items.length > 500) fail('Angebotspositionen fehlen.');
    for (const item of q.items) { str(item.name, 'Position'); str(item.unit, 'Einheit'); number(item.price, 'Preis'); number(item.quantity, 'Menge'); if (!item.name.trim() || item.price === null || item.quantity === null || item.quantity <= 0) fail('Position, Menge und Preis prüfen.'); }
    if (q.sender) { for (const k of ['business', 'owner', 'address', 'email', 'phone', 'taxNote']) str(q.sender[k], k); }
  }
  if(s.invoices!==undefined){
    if(!Array.isArray(s.invoices)||s.invoices.length>10000)fail('Ungültige Rechnungsdaten.');
    const invoiceNumbers=new Set(),invoiceIds=new Set();
    for(const invoice of s.invoices){
      for(const k of ['id','type','number','issueDate','serviceDate','dueDate','status','customerId','customerName','customerAddress','note'])str(invoice[k],k);
      if(!invoice.id||invoiceIds.has(invoice.id)||!invoice.number.trim()||invoiceNumbers.has(invoice.number))fail('Rechnungs-ID und Rechnungsnummer müssen vorhanden und eindeutig sein.');invoiceNumbers.add(invoice.number);invoiceIds.add(invoice.id);
      if(!['Komplett','Einfach'].includes(invoice.type)||!['Entwurf','Offen','Bezahlt','Storniert'].includes(invoice.status))fail('Ungültige Rechnungsart oder Status.');
      for(const key of ['issueDate','serviceDate'])if(!validDate(invoice[key]))fail('Ungültiges Rechnungs- oder Leistungsdatum.');
      if(invoice.dueDate&&(!validDate(invoice.dueDate)||invoice.dueDate<invoice.issueDate))fail('Ungültiges Zahlungsziel.');
      number(invoice.taxRate,'Umsatzsteuer',100);number(invoice.discount,'Rabatt',100);
      if(invoice.discount===null||!Array.isArray(invoice.items)||!invoice.items.length||invoice.items.length>500)fail('Rechnungspositionen fehlen.');
      for(const item of invoice.items){str(item.name,'Position');str(item.unit,'Einheit');number(item.price,'Preis');number(item.quantity,'Menge');if(!item.name.trim()||item.price===null||item.quantity===null||item.quantity<=0)fail('Rechnungsposition prüfen.');}
      if(invoice.sender)for(const k of ['business','owner','address','email','phone','taxNumber','vatId','iban','bic','bankName','taxNote'])str(invoice.sender[k]??'',k);
    }
  }
  return s;
}
export function quoteTotals(q) {
  const subtotal = round(q.items.reduce((sum, row) => sum + round(row.quantity * row.price), 0));
  const discount = round(subtotal * q.discount / 100);
  const net = round(subtotal - discount);
  const tax = q.taxRate === null ? null : round(net * q.taxRate / 100);
  return { subtotal, discount, net, tax, gross: tax === null ? null : round(net + tax) };
}
export const invoiceTotals = quoteTotals;
export function publicCatalog(s) {
  const products = s.products.filter(p => p.visible && calculate(p, s.settings).net !== null).map(p => {
    const price = calculate(p, s.settings);
    return { id:p.id, name:p.name, category:p.category, unit:p.unit, description:p.description, variant:p.variant, priceNet:price.net, priceGross:price.gross };
  });
  const textiles = s.textilePriceList ? {
    priceType:s.textilePriceList.priceType,
    note:s.textilePriceList.note,
    additionalMotifSurcharges:s.textilePriceList.additionalMotifSurcharges.map(x=>({id:x.id,label:x.label,price:x.price})),
    entries:s.textilePriceList.entries.map(entry=>({id:entry.id,name:entry.name,options:entry.options.filter(o=>o.price!==null).map(o=>({label:o.label,price:o.price}))}))
  } : null;
  const stickers = s.stickerPriceList && s.stickerPriceList.priceType !== 'ek' ? {
    priceType:s.stickerPriceList.priceType,
    formats:s.stickerPriceList.formats.map(f=>({format:f.format,variants:f.variants.map(v=>({material:v.material,tiers:v.tiers.map(t=>({quantity:t.quantity,total:t.total}))}))}))
  } : null;
  return { format:'hoodplaka67-public-prices', version:1, business:s.settings.business, taxRate:s.settings.taxRate, taxNote:s.settings.taxNote, products, textiles, stickers };
}
export function plannerSuggestions(s, todayText) {
  const today=todayText||new Date().toLocaleDateString('sv-SE');
  const items=s.plannerItems||[],open=items.filter(i=>i.status==='Offen');
  const suggestions=[];
  const overdue=open.filter(i=>i.date<today).length;
  if(overdue)suggestions.push({kind:'Dringend',text:`${overdue} überfällige ${overdue===1?'Aufgabe':'Aufgaben'} zuerst abschließen oder neu terminieren.`});
  const missingCosts=s.products.filter(p=>p.vk!==null&&['ek','finishing','minutes','packaging','other'].some(k=>p[k]===null)).length;
  if(missingCosts)suggestions.push({kind:'Kalkulation',text:`Bei ${missingCosts} Produkten fehlen noch Kostenangaben. Plane eine kurze EK-Prüfung ein.`});
  const openQuotes=s.quotes.filter(q=>q.status==='Angeboten').length;
  if(openQuotes)suggestions.push({kind:'Verkauf',text:`${openQuotes} angebotene ${openQuotes===1?'Auftrag':'Aufträge'} prüfen und bei Bedarf nachfassen.`});
  const nextWeek=new Date(`${today}T00:00:00`);nextWeek.setDate(nextWeek.getDate()+7);const limit=nextWeek.toLocaleDateString('sv-SE');
  if(!open.some(i=>i.date>=today&&i.date<=limit))suggestions.push({kind:'Planung',text:'Für die nächsten 7 Tage ist noch nichts geplant. Lege ein erreichbares Wochenziel fest.'});
  suggestions.push({kind:'Sicherung',text:'Nach größeren Preis- oder Kundendatenänderungen eine private Sicherung exportieren.'});
  return suggestions.slice(0,5);
}
