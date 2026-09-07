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
