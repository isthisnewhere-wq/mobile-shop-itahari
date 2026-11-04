/* Update dated Nepal source prices. Never infer a change from a missing quote. */
const fs=require('node:fs'),vm=require('node:vm');
const files=['catalog.json','store-catalog.json','electronics-catalog.json'];
const today=new Date().toISOString().slice(0,10);
function record(history,p,price,date){
 const list=history[p.slug]||=[];const last=list.at(-1);
 if(!last||last.price!==price)list.push({price,date,source:p.source});
}
function update(p,price,history){
 if(!Number.isFinite(price)||price<=0)throw Error('Invalid quote for '+p.slug);
 record(history,p,p.price,p.checked||today);p.price=price;p.checked=today;
 if(p.discountPercent){p.savings=Math.round(price*p.discountPercent)/100;p.proposedPrice=Math.round((price-p.savings)*100)/100;}
 record(history,p,price,today);
}
async function main(){
 const catalogs=files.map(f=>fs.existsSync(f)?JSON.parse(fs.readFileSync(f)):[]);
 const history=fs.existsSync('price-history.json')?JSON.parse(fs.readFileSync('price-history.json')):{};
 for(const p of catalogs.flat())record(history,p,p.price,p.checked||today);
 let checked=0;const errors=[];
 if(!process.argv.includes('--baseline')){
  const storeItems=[...catalogs[1],...catalogs[2]];const ids=[...new Set(storeItems.map(p=>Number(p.sourceId?.replace('gh-',''))).filter(Number.isFinite))];
  for(let start=0;start<ids.length;start+=75){
   try{const r=await fetch('https://gadgethousenepal.com/wp-json/wc/store/v1/products?per_page=100&include='+ids.slice(start,start+75).join(','),{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const list=await r.json();if(!Array.isArray(list))throw Error('Invalid feed');
    for(const p of storeItems){const q=list.find(q=>q.id===Number(p.sourceId?.replace('gh-','')));if(!q||q.prices?.currency_code!=='NPR')continue;const price=Number(q.prices.price)/10**Number(q.prices.currency_minor_unit??2);if(price>0){update(p,price,history);checked++;}}
   }catch(e){errors.push('Retail batch '+start+': '+e.message);}
  }
  try{
   const code=fs.readFileSync('collect-catalog.cjs','utf8');const cleanLine=code.match(/const clean = [\s\S]*?;\n/)[0];const fn=code.slice(code.indexOf('function parseList('),code.indexOf('function facts('));const parse=vm.runInNewContext(cleanLine+'\n'+fn+'\nparseList',{date:today});
   const r=await fetch('https://www.gadgetbytenepal.com/category/mobile-price-in-nepal/',{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const quotes=parse(await r.text());
   const key=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
   for(const p of catalogs[0]){const q=quotes.find(x=>x.source===p.source&&key(x.name)===key(p.name));if(!q)continue;const matched=p.variants.map(v=>q.variants.find(x=>key(x.label)===key(v.label)));if(matched.some(v=>!v))continue;p.variants=p.variants.map((v,i)=>({...v,price:matched[i].price}));const min=Math.min(...p.variants.map(v=>v.price));update(p,min,history);p.variant=p.variants.find(v=>v.price===min).label;checked++;}
  }catch(e){errors.push('Phone source: '+e.message);}
 }
 for(let i=0;i<files.length;i++)if(fs.existsSync(files[i]))fs.writeFileSync(files[i],JSON.stringify(catalogs[i],null,2));
 fs.writeFileSync('price-history.json',JSON.stringify(history,null,2));
 fs.writeFileSync('price-update-status.json',JSON.stringify({attempted:today,checked,total:catalogs.flat().length,errors},null,2));
 console.log('Checked',checked,'of',catalogs.flat().length,'listings;',Object.values(history).filter(h=>h.length>1).length,'recorded price changes.');
 if(errors.length)console.warn(errors.join('\n'));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={record,update};
