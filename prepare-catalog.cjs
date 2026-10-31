const fs = require('node:fs');
const all = JSON.parse(fs.readFileSync('catalog-candidates.json', 'utf8'));
const groups = [...new Set(all.map(p => p.brand))].map(brand => all.filter(p => p.brand === brand));
const chosen = [];
for (let i = 0; chosen.length < 120; i++) {
  for (const group of groups) if (group[i] && chosen.length < 120) chosen.push(group[i]);
  if (i > all.length) throw Error('Not enough models');
}
// Retain existing public phone URLs, and the two older models already on the site.
const overrides = { 'samsung-galaxy-s25-ultra': 'galaxy-s25-ultra', 'iphone-16': 'iphone-16' };
for (const p of chosen) {
  p.slug = overrides[p.slug] || p.slug;
  p.price = Math.min(...p.variants.map(v => v.price));
  p.variant = p.variants.find(v => v.price === p.price).label;
  p.image = 'phone-' + p.slug + '.jpg';
  if (p.slug === 'iphone-16') p.image = 'iphone-16.jpg';
  if (p.slug === 'galaxy-s25-ultra') p.image = 'galaxy-s25-ultra.jpg';
}
for (const key of ['iPhone 16', 'Galaxy S25 Ultra']) {
  if (!chosen.some(p => p.name === key)) {
    const p = all.find(p => p.name === key);
    p.slug = overrides[p.slug] || p.slug;
    p.price = Math.min(...p.variants.map(v => v.price));
    p.variant = p.variants.find(v => v.price === p.price).label;
    p.image = p.slug + '.jpg';
    chosen.push(p);
  }
}
chosen.push(
  { name:'Galaxy A56 5G',brand:'Samsung',slug:'galaxy-a56',price:71999,variant:'8GB / 256GB',variants:[{label:'8GB / 256GB',price:71999},{label:'12GB / 256GB',price:77999}],image:'galaxy-a56.jpg',checked:'2026-10-30',source:'https://www.gadgetbytenepal.com/samsung-galaxy-a56-price-nepal/',specSource:'https://www.gadgetbytenepal.com/samsung-galaxy-a56-price-nepal/',imageSource:'https://www.gadgetbytenepal.com/product/samsung-galaxy-a56-5g/',review:'https://www.gadgetbytenepal.com/samsung-galaxy-a56-review/',specs:{display:'6.7-inch AMOLED, 120Hz',chipset:'Exynos 1580',memory:'8GB / 256GB or 12GB / 256GB',camera:'50MP main, 12MP ultrawide, 5MP macro',selfie:'12MP',battery:'5,000mAh, 45W charging',connectivity:'5G, USB-C, Wi-Fi 6',software:'Android / One UI',build:'IP67 rated'}},
  { name:'Redmi Note 14 4G',brand:'Xiaomi',slug:'redmi-note-14',price:23999,variant:'6GB / 128GB',variants:[{label:'6GB / 128GB',price:23999},{label:'8GB / 256GB',price:26999}],image:'redmi-note-14.jpg',checked:'2026-10-30',source:'https://www.gadgetbytenepal.com/redmi-note-14-4g-price-nepal/',specSource:'https://www.gadgetbytenepal.com/redmi-note-14-4g-price-nepal/',imageSource:'https://www.gadgetbytenepal.com/product/redmi-note-14-4g/',review:null,specs:{display:'6.67-inch AMOLED, 120Hz',chipset:'Helio G99 Ultra',memory:'6GB / 128GB or 8GB / 256GB',camera:'108MP main camera',selfie:'20MP',battery:'5,500mAh, 33W charging',connectivity:'4G, Wi-Fi 5, USB-C',software:'Xiaomi HyperOS',build:'Gorilla Glass 5, IP54'}}
);
function assessment(p) {
  const s = p.specs, chip = s.chipset || '';
  let tier = 'Everyday';
  if (/8\s*(?:Elite|Gen\s*[23])|A1[7-9]|A20|Dimensity\s*(?:9\d{3})|Snapdragon\s*8[89]\d/i.test(chip)) tier = 'Flagship';
  else if (/Snapdragon\s*(?:7|8s)|Dimensity\s*[78]\d{3}|Exynos\s*(?:1[45]|2)\d{2}|A1[456]/i.test(chip)) tier = 'Performance';
  else if (/G99|G100|G200|G2[0-9]{2}|Snapdragon\s*[46]|Dimensity\s*[67]\d{3}|Exynos\s*1[23]\d{2}|T8[0-9]{2}/i.test(chip)) tier = 'Balanced';
  const fiveG = /\b5G\b/i.test(s.connectivity || '') || /\b5G\b/i.test(p.name);
  const batteryMatch = (s.battery || '').replace(/,/g,'').match(/(\d{4,5})\s*m\s*Ah/i);
  const battery = batteryMatch ? Number(batteryMatch[1]) : null;
  const refresh = (s.display || '').match(/(\d{2,3})\s*Hz/i)?.[1] || null;
  const oled = /AMOLED|OLED/i.test(s.display || '');
  const performance = {
    Flagship:'The listed chipset belongs to a high-end family. It is a strong starting point for demanding apps, multitasking, and games, although sustained speed depends on cooling and software.',
    Performance:'The listed chipset targets performance-focused daily use. It should suit multitasking and many games, with graphics settings adjusted for heavier titles.',
    Balanced:'This hardware targets everyday multitasking and lighter gaming. Start demanding games at modest settings; smoothness will vary by title and software.',
    Everyday:'Treat this as an everyday-use option for messaging, calls, browsing, and lighter apps. Check a model-specific gaming test before choosing it for demanding titles.'
  }[tier];
  const pros = [oled ? 'OLED-family panel is listed for contrast-rich viewing.' : 'Compare the listed screen size and panel type for your viewing needs.',fiveG ? '5G connectivity is listed for compatible networks.' : 'Consider it primarily for the listed mobile network support.',battery && battery>=5500 ? 'A battery capacity of at least 5,500mAh is listed.' : 'Multiple price/storage options can help you match your budget.'];
  const cautions = ['Store stock, local warranty, included charger, and final price need confirmation.'];
  if (!fiveG) cautions.push('5G support is not confirmed in the collected specifications.');
  if (refresh && Number(refresh)<=60) cautions.push('The listed refresh rate is 60Hz; compare with higher-refresh alternatives if smooth scrolling matters.');
  else if (tier==='Everyday' || tier==='Balanced') cautions.push('Do not assume flagship gaming performance from RAM capacity alone.');
  else cautions.push('A fast chipset does not by itself establish battery life, camera quality, or sustained gaming performance.');
  return {tier,fiveG,battery,refresh:refresh?Number(refresh):null,oled,performance,pros,cautions};
}
for (const p of chosen) p.assessment = assessment(p);
if (new Set(chosen.map(p=>p.slug)).size !== chosen.length) throw Error('Duplicate product URLs');
fs.writeFileSync('catalog.json',JSON.stringify(chosen,null,2));
console.log('Prepared',chosen.length,'distinct model pages;',new Set(chosen.map(p=>p.brand)).size,'brands.');
async function download() {
  let cursor=0, failures=[];
  async function worker(){while(cursor<chosen.length){const p=chosen[cursor++];if(fs.existsSync(p.image))continue;try{const r=await fetch(p.imageUrl,{signal:AbortSignal.timeout(25000)});if(!r.ok||!r.headers.get('content-type')?.includes('image'))throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());if(b.length>2000000)throw Error('Image exceeds 2MB');fs.writeFileSync(p.image,b);console.log(p.slug,b.length);}catch(e){failures.push({slug:p.slug,error:e.message});}}}
  await Promise.all([worker(),worker(),worker()]);
  fs.writeFileSync('image-download-errors.json',JSON.stringify(failures,null,2));
  console.log('Download failures:',failures.length);
  if(failures.length)process.exitCode=1;
}
download().catch(e=>{console.error(e);process.exitCode=1});
