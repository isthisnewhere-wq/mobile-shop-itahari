/* Shared imagery and layout polish, applied after all page generators. */
const fs=require('node:fs');
const phones=require('./catalog.json'),store=require('./store-catalog.json'),electronics=require('./electronics-catalog.json');
const products=[...phones.map(p=>({...p,category:'smartphones'})),...store,...electronics];
const labels={smartphones:'Smartphones',laptops:'Laptops',earbuds:'Earbuds',speakers:'Speakers',headsets:'Headsets',keyboards:'Keyboards','laptop-accessories':'Laptop accessories',...Object.fromEntries(Object.entries(require('./electronics-categories.json')).map(([k,v])=>[k,v.name]))};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hero=`<section class="container editorial-hero"><div class="editorial-hero-copy"><p class="eyebrow">NEPAL ELECTRONICS PRICE GUIDE</p><h1>Your next device.<br><em>A clearer choice.</em></h1><p>Explore phones, laptops, and everyday electronics.<br>Compare Nepal reference prices and find what fits your budget.</p><div class="editorial-actions"><a class="button button-lime" href="all-products.html">Explore all device prices <span aria-hidden="true">↗</span></a><a class="editorial-secondary" href="price-changes.html">Follow price changes →</a></div><div class="editorial-facts"><span><strong>${products.length.toLocaleString('en-IN')}</strong> sourced listings</span><span><strong>${Object.keys(labels).length}</strong> device categories</span><span><strong>NPR</strong> reference prices</span></div></div><span class="scene-caption">Electronics imagery for illustration</span></section>`;
function compact(body,grid,keep,title){return body.replace(new RegExp('<div class="'+grid+'">([\\s\\S]*?)<\\/div>'),(whole,contents)=>{const links=[...contents.matchAll(/<a\b[\s\S]*?<\/a>/g)].map(m=>m[0]);if(links.length<=keep)return whole;return `<div class="${grid}">${links.slice(0,keep).join('')}</div><details class="category-reveal"><summary>${title} <span>${links.length-keep} more categories +</span></summary><div class="${grid}">${links.slice(keep).join('')}</div></details>`;});}
module.exports=function(published){
 for(const file of published.filter(f=>f.endsWith('.html'))){
  let html=fs.readFileSync(file,'utf8');
  const product=products.find(p=>p.slug+'.html'===file);
  const category=product?.category||(labels[file.replace('.html','')]?file.replace('.html',''):null);
  const representative=product||products.find(p=>p.category===category);
  const image=representative?.image||'electronics-scene.webp';
  html=html.replace(/ data-visual="[^"]*"/g,'').replace(/ style="--page-image:[^"]*"/g,'');
  html=html.replace('<body ',`<body data-visual="${product?'device':category?'category':'general'}" style="--page-image:url('${esc(image)}')" `);
  let body=html.match(/<main id="main"[^>]*>([\s\S]*?)<\/main>/)?.[1];if(body===undefined)continue;
  if(file==='index.html'){
   body=body.replace(/<section class="container hero-bento">[\s\S]*?<\/section>/,hero).replace(/<section class="container editorial-hero">[\s\S]*?<\/section>/,hero);
   body=compact(body,'nepal-category-prices',8,'Explore every electronics category');
   body=body.replace(/<section class="container department-section">[\s\S]*?<\/section>/,'');
  }
  if(product){
   body=body.replace(/<div class="device-scene">[\s\S]*?<\/div>/g,'');
   const banner=`<div class="device-scene"><p class="eyebrow">${esc(labels[category]||'Electronics')} · NEPAL PRICE GUIDE</p><p>See the device.<br><strong>Understand the details.</strong></p><span>Real model photo · dated reference price</span></div>`;
   body=body.replace('</nav>','</nav>'+banner);
  }
  html=html.replace(/<main id="main"[^>]*>[\s\S]*?<\/main>/,'<main id="main">'+body+'</main>');
  fs.writeFileSync(file,html);
 }
 for(const f of ['BACKGROUND-ASSET.md','electronics-scene.webp','visual-refresh.cjs'])if(!published.includes(f))published.push(f);
};
