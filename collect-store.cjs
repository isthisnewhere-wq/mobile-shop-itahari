const fs=require('node:fs');
const clean=value=>String(value||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;|&#160;/g,' ').replace(/&#8211;|&ndash;/g,'–').replace(/&#8217;|&rsquo;/g,"'").replace(/&#8220;|&#8221;|&quot;/g,'"').replace(/&#215;|&times;/g,'×').replace(/&#039;|&apos;/g,"'").replace(/\s+/g,' ').trim();
const origins={gh:'https://gadgethousenepal.com',it:'https://infotechsnepal.com.np'};
const requests=[['earbuds','gh',299],['speakers','gh',374],['headsets','gh',268],['keyboards','gh',26],['bags','gh',2813],['ram','gh',5150],['cooling','gh',5652],['docks','gh',3562],['tables','gh',4080],['coolers','gh',2668],['mice','gh',236],['laptops','gh',1141]];
async function getProducts(key,origin,category){
 const url=origins[origin]+'/wp-json/wc/store/v1/products?per_page=100&category='+category;
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(url+' '+r.status);
 const list=await r.json();if(!Array.isArray(list))throw Error('Invalid catalog '+key);
 return list.map(p=>{
  const minor=Number(p.prices?.currency_minor_unit??2),price=Number(p.prices?.price)/10**minor;
  const attributes=(p.attributes||[]).map(a=>({label:clean(a.name),value:(a.terms||[]).map(t=>clean(t.name)).join(', ')})).filter(a=>a.label&&a.value);
  return {sourceId:origin+'-'+p.id,name:clean(p.name),price,currency:p.prices?.currency_code,source:p.permalink,imageUrl:p.images?.[0]?.src,imageAlt:clean(p.images?.[0]?.alt),attributes,categories:(p.categories||[]).map(c=>clean(c.name)),shortDescription:clean(p.short_description),description:clean(p.description),checked:'2026-10-31'};
 }).filter(p=>p.price>0&&p.currency==='NPR'&&p.imageUrl&&p.name);
}
const keyFor=p=>p.name.toLowerCase().replace(/\b(black|white|blue|red|green|pink|purple|silver|gold|gray|grey|color|colour)\b/g,'').replace(/[^a-z0-9]/g,'');
function unique(list){const seen=new Set();return list.filter(p=>{const key=keyFor(p);if(seen.has(key))return false;seen.add(key);return true;});}
async function main(){
 const source=fs.existsSync('store-research.json')?JSON.parse(fs.readFileSync('store-research.json')):{};
 for(const [key,origin,category]of requests){if(!source[key]){source[key]=await getProducts(key,origin,category);fs.writeFileSync('store-research.json',JSON.stringify(source,null,2));}console.log(key,source[key].length);}
 fs.writeFileSync('store-research.json',JSON.stringify(source,null,2));
 const result=[];
 function add(category,list,count){const models=unique(list).slice(0,count);if(models.length<count)throw Error(category+' needs '+count+', found '+models.length);for(const p of models){p.category=category;p.slug='shop-'+p.sourceId;p.image='item-'+p.sourceId+'.jpg';result.push(p);}}
 add('earbuds',source.earbuds.filter(p=>!/(?:case only|cover only|replacement|neckband)/i.test(p.name)),50);
 add('speakers',source.speakers.filter(p=>!/microphone only|remote only|speaker stand/i.test(p.name)),50);
 add('headsets',source.headsets.filter(p=>!/stand|earbuds|tws|earphone/i.test(p.name)),50);
 add('keyboards',source.keyboards.filter(p=>!/keycap|switch only|keyboard cover|keyboard cleaner/i.test(p.name)),50);
 const accessories=[...source.bags,...source.cooling,...source.docks,...source.tables,...source.coolers,...source.ram.slice(0,10),...source.mice].filter(p=>!result.some(x=>x.sourceId===p.sourceId));
 add('laptop-accessories',accessories,50);
 // Different laptop model families, with a spread of brands and configurations.
 const modelKey=p=>p.name.toLowerCase().split(/\b(?:intel|amd|ryzen|core|with|\d+gb|\d+tb|m[1-5]\s*chip)\b/)[0].replace(/\b(?:202[0-9]|laptop)\b/g,'').replace(/[^a-z0-9]/g,'');
 const seen=new Set();const laptops=source.laptops.filter(p=>p.price>=30000&&/laptop|macbook|thinkpad|ideapad|vivobook|latitude|pavilion|aspire|tuf|legion|loq|elitebook/i.test(p.name)).filter(p=>{const key=modelKey(p);if(key.length<4||seen.has(key))return false;seen.add(key);return true;});
 add('laptops',laptops,10);
 for(const p of result){if(p.category==='laptops'){p.discountPercent=10;p.proposedPrice=Math.round(p.price*90)/100;p.savings=Math.round((p.price-p.proposedPrice)*100)/100;}delete p.description;delete p.shortDescription;}
 if(new Set(result.map(p=>p.slug)).size!==result.length)throw Error('Duplicate models across categories');
 fs.writeFileSync('store-catalog.json',JSON.stringify(result,null,2));
 console.log('Prepared',result.length,'products.');
 let cursor=0,errors=[];
 async function worker(){while(cursor<result.length){const p=result[cursor++];if(fs.existsSync(p.image))continue;try{const r=await fetch(p.imageUrl,{signal:AbortSignal.timeout(25000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());if(b.length>5000000)throw Error('Image too large');fs.writeFileSync(p.image,b);console.log(p.slug,b.length);}catch(e){errors.push({slug:p.slug,message:e.message});}}}
 await Promise.all([worker(),worker(),worker()]);fs.writeFileSync('store-image-errors.json',JSON.stringify(errors,null,2));console.log('Image errors',errors.length);if(errors.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
