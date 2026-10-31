const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const items=JSON.parse(fs.readFileSync('store-catalog.json')),phones=JSON.parse(fs.readFileSync('catalog.json'));
for(const category of ['laptop-accessories','earbuds','speakers','headsets','keyboards'])assert.equal(items.filter(p=>p.category===category).length,50,category);
const laptops=items.filter(p=>p.category==='laptops');assert.equal(laptops.length,10);
assert.equal(new Set(items.map(p=>p.slug)).size,260);
assert.equal(items.filter(p=>p.category==='earbuds'&&/liberty\s*4\s*nc/i.test(p.name)).length,1,'Duplicate Liberty 4 NC');
assert(items.filter(p=>p.category==='headsets').every(p=>/headset|headphone/i.test(p.name)&&!/keyboard/i.test(p.name)),'Wrong headset category');
for(const p of laptops){assert.equal(p.discountPercent,10);assert.equal(Math.round(p.proposedPrice*100),Math.round(p.price*90));assert.equal(Math.round((p.price-p.proposedPrice)*100),Math.round(p.savings*100));const html=fs.readFileSync(p.slug+'.html','utf8');assert(html.includes('Proposed 10% off'));assert(html.includes('id="discount"'));assert(html.includes('not confirmed store')||html.includes('Confirm the offer directly'));}
const published=JSON.parse(fs.readFileSync('publish-files.json'));let links=0;
for(const file of published){assert(fs.existsSync(file),'Missing '+file);if(!file.endsWith('.html'))continue;const html=fs.readFileSync(file,'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+' h1');assert(!html.includes('undefined'),file+' undefined');assert(html.includes('href="laptops.html"'),file+' laptop navigation');assert(html.includes('href="all-products.html"'),file+' all-products navigation');for(const [,value]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(https?:|tel:|mailto:)/.test(value))continue;const u=new URL(value.replaceAll('&amp;','&'),'https://example.com/'+file),target=decodeURIComponent(u.pathname.slice(1))||file;assert(fs.existsSync(target),file+' -> '+target);if(u.hash&&target.endsWith('.html'))assert(fs.readFileSync(target,'utf8').includes('id="'+u.hash.slice(1)+'"'),file+' broken anchor '+value);links++;}}
for(const p of items){const b=fs.readFileSync(p.image);assert(b.length>1000,p.slug+' image');assert(p.source.startsWith('https://gadgethousenepal.com/'),p.slug+' source');assert(p.price>0,p.slug+' price');}
console.log('PASS: 5 × 50 accessory products, 10 correct proposed discounts, 260 unique detail pages, all images, and '+links+' local links.');
function el(extra={}){return Object.assign({value:'',tagName:'DIV',type:'',hidden:false,disabled:false,textContent:'',dataset:{},listeners:{},options:[],addEventListener(k,fn){this.listeners[k]=fn;},focus(){},scrollIntoView(){},setAttribute(){}},extra);}
const combined=[...phones.map(p=>({name:p.name,brand:p.brand,category:'smartphones',price:p.price,features:[]})),...items];
function run(search=''){
 const nodes={},fields={};let order=[];
 const cards=combined.map((p,i)=>el({dataset:{storeName:(p.name+' '+p.brand+' '+p.features.map(f=>f.value).join(' ')).toLowerCase(),storeBrand:p.brand,storeCategory:p.category,storePrice:String(p.proposedPrice??p.price),storeOrder:String(i)},querySelector(){return{textContent:p.name};}}));order=[...cards];
 nodes['#store-products']=el({querySelectorAll(){return cards;},appendChild(card){order=order.filter(c=>c!==card);order.push(card);}});
 const defs={brand:['All',...new Set(combined.map(p=>p.brand))],department:['All',...new Set(combined.map(p=>p.category))],budget:['all','0-1000','1000-3000','3000-10000','10000-50000','50000-150000','150000-9999999'],sort:['featured','price-low','price-high','name']};
 fields.q=nodes['#store-search']=el();
 for(const[k,values]of Object.entries(defs)){const id=k==='department'?'category':k;fields[k]=nodes['#store-'+id]=el({tagName:'SELECT',value:values[0],options:values.map(value=>({value}))});}
 for(const id of ['filters','results','empty','pagination','previous','next','page'])nodes['#store-'+id]=el();
 const location={search,pathname:'/all-products.html'};
 const context={window:{location,matchMedia(){return{matches:true};},addEventListener(){}},history:{replaceState(a,b,url){location.search=url.includes('?')?url.slice(url.indexOf('?')):'';}},URLSearchParams,setTimeout(fn){fn();return 1;},clearTimeout(){},document:{querySelector(s){return nodes[s]||null;}}};
 vm.runInNewContext(fs.readFileSync('store.js','utf8'),context);return{nodes,fields,location,visible:()=>order.filter(c=>!c.hidden)};
}
let page=run();assert.equal(page.visible().length,12);assert.match(page.nodes['#store-results'].textContent,/382 products/);page.nodes['#store-next'].listeners.click();assert.equal(page.visible()[0].dataset.storeOrder,'12');assert.match(page.location.search,/page=2/);
page=run('?department=laptops&sort=price-low');assert.equal(page.visible().length,10);assert(page.visible().every(c=>c.dataset.storeCategory==='laptops'));assert(Number(page.visible()[0].dataset.storePrice)<=Number(page.visible().at(-1).dataset.storePrice));
page=run('?department=earbuds');assert.match(page.nodes['#store-results'].textContent,/50 products/);assert(page.visible().every(c=>c.dataset.storeCategory==='earbuds'));
page=run('?budget=0-1000');assert(page.visible().every(c=>Number(c.dataset.storePrice)<1000));
page=run('?q=not-a-real-product');assert.equal(page.visible().length,0);assert.equal(page.nodes['#store-empty'].hidden,false);
page=run('?department=invalid&page=9999');assert.equal(page.fields.department.value,'All');assert.equal(page.visible().length,10);assert.match(page.nodes['#store-page'].textContent,/Page 32 of 32/);
console.log('PASS: 382-product pagination, department filtering, proposed-price sorting, budgets, empty results, and invalid URL recovery.');
