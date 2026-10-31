/* Dependency-free regression checks for filters, pagination, variants, and comparison. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const products=JSON.parse(fs.readFileSync('catalog.json','utf8'));
function element(extra={}) {
  const classes=new Set();
  return Object.assign({value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,checked:false,type:'',tagName:'DIV',dataset:{},listeners:{},attributes:{},options:[],classList:{toggle(name){if(classes.has(name)){classes.delete(name);return false;}classes.add(name);return true;},remove(name){classes.delete(name);}},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(name,value){this.attributes[name]=value;},querySelectorAll(){return [];},focus(){},scrollIntoView(){}},extra);
}
function run({search='',stored='[]',comparison=false,variant=false,brokenStorage=false}={}) {
  const nodes={'.menu-toggle':element(),'#navigation':element(),'#year':element(),'#compare-tray':element(),'#compare-status':element(),'#compare-link':element(),'#clear-compare':element()};
  const buttons=products.slice(0,4).map(p=>element({dataset:{compare:p.slug}}));
  const cards=products.map((p,i)=>element({dataset:{price:String(p.price),order:String(i),brand:p.brand,name:(p.brand+' '+p.name+' '+p.specs.chipset).toLowerCase(),tier:p.assessment.tier,fiveg:String(p.assessment.fiveG),battery:String(p.assessment.battery||0)},querySelector(){return{textContent:p.name};}}));
  const fields={};
  let gridOrder=[...cards];
  function select(id,values){nodes[id]=element({type:'select-one',tagName:'SELECT',value:values[0],options:values.map(value=>({value}))});return nodes[id];}
  if(!comparison&&!variant){
    nodes['#products']=element({querySelectorAll(){return cards;},appendChild(card){gridOrder=gridOrder.filter(c=>c!==card);gridOrder.push(card);}});
    fields.q=nodes['#search']=element({type:'search'});
    fields.brand=select('#brand-filter',['All',...new Set(products.map(p=>p.brand))]);
    fields.budget=select('#budget-filter',['all','0-20000','20000-40000','40000-70000','70000-100000','100000-9999999']);
    fields.tier=select('#performance-filter',['All','Everyday','Balanced','Performance','Flagship']);
    fields.sort=select('#sort',['featured','price-low','price-high','name']);
    fields.fiveg=nodes['#fiveg-filter']=element({type:'checkbox'});
    fields.battery=nodes['#battery-filter']=element({type:'checkbox'});
    for(const name of ['#catalog-filters','#results-count','#empty-state','#pagination','#previous-page','#next-page','#page-status'])nodes[name]=element();
  }
  const selectors=comparison?Array.from({length:3},()=>element()):[];
  if(comparison){nodes['#comparison-table']=element();nodes['#comparison-message']=element();}
  if(variant){const p=products.find(x=>x.variants.length>1);nodes['#variant-select']=element({dataset:{product:p.slug},selectedOptions:[{value:p.variants[0].label,dataset:{price:p.variants[0].price}}]});nodes['#variant-price']=element();nodes['#variant-enquiry']=element();}
  const location={search,pathname:comparison?'/compare.html':'/smartphones.html'};
  const history={replaceState(_a,_b,url){const i=url.indexOf('?');location.search=i<0?'':url.slice(i);}};
  const store=new Map([['eakraj-compare',stored]]);
  const context={window:{EAKRAJ_CATALOG:products,location,matchMedia(){return{matches:true};},addEventListener(){}},history,URLSearchParams,Date,Intl,localStorage:{getItem(k){if(brokenStorage)throw Error('Blocked');return store.get(k);},setItem(k,v){if(brokenStorage)throw Error('Blocked');store.set(k,v);}},setTimeout(fn){fn();return 1;},clearTimeout(){},document:{querySelector(s){return nodes[s]||null;},querySelectorAll(s){return s==='.compare-select'?selectors:s==='[data-compare]'?buttons:[];},addEventListener(){}}};
  vm.runInNewContext(fs.readFileSync('script.js','utf8'),context);
  return{nodes,fields,buttons,selectors,cards,location,store,visible(){return gridOrder.filter(c=>!c.hidden);}};
}
let page=run();assert.equal(page.visible().length,12);assert.match(page.nodes['#results-count'].textContent,/151 phones/);
page.nodes['#next-page'].listeners.click();assert.match(page.nodes['#page-status'].textContent,/Page 2/);assert.match(page.location.search,/page=2/);assert.equal(page.visible()[0].dataset.order,'12');
page.fields.brand.value='Samsung';page.fields.brand.listeners.change();assert(page.visible().every(c=>c.dataset.brand==='Samsung'));assert(!page.location.search.includes('page=2'));
page.fields.q.value='no-such-phone';page.fields.q.listeners.input();assert.equal(page.visible().length,0);assert.equal(page.nodes['#empty-state'].hidden,false);
page=run({search:'?budget=0-20000&sort=price-low'});assert(page.visible().length>0);assert(page.visible().every(c=>Number(c.dataset.price)<20000));assert(Number(page.visible()[0].dataset.price)<=Number(page.visible().at(-1).dataset.price));
page=run({search:'?brand=Samsung&tier=Flagship'});assert(page.visible().every(c=>c.dataset.brand==='Samsung'&&c.dataset.tier==='Flagship'));
page=run({search:'?fiveg=1&battery=1'});assert(page.visible().every(c=>c.dataset.fiveg==='true'&&Number(c.dataset.battery)>=5500));
page=run({search:'?brand=not-real&page=9999'});assert.equal(page.fields.brand.value,'All');assert.equal(page.visible().length,products.length%12||12);assert.equal(page.nodes['#page-status'].textContent,'Page '+Math.ceil(products.length/12)+' of '+Math.ceil(products.length/12));
page=run({brokenStorage:true});assert.equal(page.visible().length,12);
page=run();for(const b of page.buttons)b.listeners.click();assert.equal(JSON.parse(page.store.get('eakraj-compare')).length,3);assert.match(page.nodes['#compare-status'].textContent,/up to 3/);page.buttons[0].listeners.click();assert.equal(JSON.parse(page.store.get('eakraj-compare')).length,2);page.nodes['#clear-compare'].listeners.click();assert.equal(page.nodes['#compare-tray'].hidden,true);
page=run({comparison:true,search:'?phones=iphone-16,galaxy-a56,unknown,iphone-16'});assert(page.nodes['#comparison-table'].innerHTML.includes('Galaxy A56'));assert(!page.nodes['#comparison-table'].innerHTML.includes('unknown'));assert.equal(page.selectors.filter(s=>s.value).length,2);
page.selectors[1].value='iphone-16';page.selectors[1].listeners.change();assert.match(page.nodes['#comparison-message'].textContent,/already selected/);
page=run({variant:true});const p=products.find(x=>x.variants.length>1),v=p.variants[1];page.nodes['#variant-select'].selectedOptions=[{value:v.label,dataset:{price:v.price}}];page.nodes['#variant-select'].listeners.change();assert(page.nodes['#variant-price'].textContent.includes(new Intl.NumberFormat('en-IN').format(v.price)));assert(decodeURIComponent(page.nodes['#variant-enquiry'].href).includes(v.label));
console.log('PASS: 151-model pagination, combined filters, sorting, empty results, URL restoration, invalid URL values, blocked storage, comparison limit/removal/duplicates, and variant-price/enquiry updates.');
