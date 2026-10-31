/* Refresh factual Nepal price references and specification fields. */
const fs = require('node:fs');
const base = 'https://www.gadgetbytenepal.com';
const date = '2026-10-31';
const clean = value => value.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8211;|&ndash;/g, '–').replace(/&#215;|&times;/g, '×').replace(/\s+/g, ' ').trim();
async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw Error(url + ': HTTP ' + r.status);
  return r.text();
}
function parseList(html) {
  const brands = ['Samsung', 'Apple iPhone', 'Xiaomi', 'Honor', 'OPPO', 'POCO', 'Vivo', 'Nothing', 'OnePlus', 'Infinix', 'Realme', 'Motorola', 'ZTE', 'Ai+', 'Tecno'];
  const entries = new Map();
  for (const table of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)) {
    const headings = [...html.slice(0, table.index).matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)];
    let brand = clean(headings.at(-1)?.[1] || '');
    if (!brands.includes(brand)) continue;
    if (brand === 'Apple iPhone') brand = 'Apple';
    for (const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
      if (cells.length < 2) continue;
      const link = cells[0].match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!link) continue;
      let name = clean(link[2]).replace(/\s*\(New\)/gi, '');
      const rest = clean(cells[0].replace(link[0], ''));
      const variant = rest.replace(/^[\s(]+|[\s)]+$/g, '').replace(/\s*\+\s*/g, ' / ');
      const priceText = clean(cells[1].replace(/<(del|s)\b[^>]*>[\s\S]*?<\/\1>/gi, ''));
      const prices = [...priceText.matchAll(/\d{1,3}(?:,\d{3})+/g)].map(m => Number(m[0].replaceAll(',', '')));
      const price = prices.at(-1);
      if (!price || !variant || price < 5000 || !link[1].startsWith('http')) continue;
      const key = brand + ':' + name.toLowerCase();
      if (!entries.has(key)) entries.set(key, { name, brand, source: link[1], variants: [], checked: date });
      const product = entries.get(key);
      if (!product.variants.some(v => v.label === variant)) product.variants.push({ label: variant, price });
    }
  }
  return [...entries.values()].map(p => ({ ...p, slug: (p.brand === 'Samsung' && !p.name.startsWith('Samsung') ? 'samsung-' : '') + p.name.toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));
}
function facts(html) {
  const fields = {};
  const list = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(m => clean(m[1])).filter(t => t.length < 550);
  const wanted = { display: /^(?:Display|Screen)\s*:/i, chipset: /^(?:Chipset|Processor|SoC)\s*:/i, memory: /^(?:Memory|RAM(?:\s*(?:and|&)\s*Storage)?|Storage)\s*:/i, software: /^(?:Software(?:\s*(?:and|&)\s*UI)?|OS|Operating System)\s*:/i, camera: /^(?:Rear\s*Cameras?|Back\s*Cameras?|Cameras?)\s*:/i, selfie: /^(?:Front\s*Camera|Selfie\s*Camera)\s*:/i, battery: /^(?:Battery(?:\s*(?:and|&)\s*Charging)?)\s*:/i, charging: /^Charging\s*:/i, connectivity: /^(?:Connectivity|Network)\s*:/i, build: /^(?:Design(?:,?\s*(?:and|&)?\s*build)?|Build|Dimensions)\s*:/i, security: /^Security\s*:/i };
  for (const [key, pattern] of Object.entries(wanted)) {
    const item = list.find(t => pattern.test(t));
    if (item) fields[key] = item.replace(pattern, '').trim().slice(0, 320);
  }
  // Product specification tables provide a fallback when the article has no spec list.
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)];
  const tableMap = { Chipset: 'chipset', 'Display Type': 'display', 'Rear Camera': 'camera', Battery: 'battery', Charging: 'charging', OS: 'software' };
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(m => clean(m[1]));
    const key = tableMap[cells[0]];
    if (key && cells[1] && !fields[key]) fields[key] = cells[1].slice(0, 320);
  }
  return fields;
}
function imageFrom(html) {
  const match = html.match(/<meta[^>]*(?:property|name)="og:image"[^>]*content="([^"]+)"/i) || html.match(/<meta[^>]*content="([^"]+)"[^>]*(?:property|name)="og:image"/i);
  return match ? match[1].replaceAll('&amp;', '&') : null;
}
async function main() {
  const html = fs.existsSync('source-catalog.html') ? fs.readFileSync('source-catalog.html', 'utf8') : await get(base + '/category/mobile-price-in-nepal/');
  const all = parseList(html);
  console.log('Found', all.length, 'distinct models across', new Set(all.map(p => p.brand)).size, 'brands.');
  const cache = fs.existsSync('catalog-research.json') ? JSON.parse(fs.readFileSync('catalog-research.json')) : [];
  let next = 0;
  async function worker() {
    while (next < all.length) {
      const p = all[next++];
      const existing = cache.find(c => c.source === p.source && c.name === p.name);
      if (existing) { Object.assign(p, existing, { variants: p.variants }); continue; }
      try {
        const article = await get(p.source);
        p.specs = facts(article);
        p.imageUrl = imageFrom(article);
        const reviewLinks = [...article.matchAll(/<a\b[^>]*href="([^"]*(?:review)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => ({ url: m[1], label: clean(m[2]) }));
        const nameWords = p.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
        p.review = reviewLinks.find(l => nameWords.every(w => l.url.toLowerCase().includes(w)))?.url || null;
        if (Object.keys(p.specs).length < 3) {
          const links = [...new Set([...article.matchAll(/href="(https?:\/\/[^" ]*\/product\/[^"?# ]+)"/g)].map(m => m[1]))];
          const ranked = links.map(url => ({ url, score: nameWords.filter(w => url.includes(w)).length })).sort((a,b) => b.score-a.score);
          if (ranked[0] && ranked[0].score >= Math.min(2, nameWords.length)) {
            const product = await get(ranked[0].url);
            const more = facts(product);
            p.specs = { ...more, ...p.specs };
            p.specSource = ranked[0].url;
          }
        }
        p.specSource ||= p.source;
        p.imageSource = p.source;
        cache.push(p);
        fs.writeFileSync('catalog-research.json', JSON.stringify(cache, null, 2));
        console.log(p.brand, p.name, Object.keys(p.specs).length, 'fields');
      } catch (error) { p.error = error.message; console.log('SKIP', p.name, error.message); }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  const valid = all.filter(p => !p.error && p.imageUrl && Object.keys(p.specs || {}).length >= 3);
  fs.writeFileSync('catalog-candidates.json', JSON.stringify(valid, null, 2));
  console.log('Usable products:', valid.length);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
