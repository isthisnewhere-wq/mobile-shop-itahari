const fs=require('node:fs');
const definitions=require('./electronics-categories.json');
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#8211;/g,'–').replace(/&#8217;/g,"'").replace(/&nbsp;/g,' ').replace(/&#\d+;/g,' ').replace(/\s+/g,' ').trim();
async function main(){
 const existing=JSON.parse(fs.readFileSync('store-catalog.json'));const used=new Set(existing.map(p=>p.source));
 const output=[],images=[];const today=new Date().toISOString().slice(0,10);
 for(const [category,def]of Object.entries(definitions)){
  for(let page=1;;page++){
   const r=await fetch(`https://gadgethousenepal.com/wp-json/wc/store/v1/products?per_page=100&category=${def.id}&page=${page}`,{signal:AbortSignal.timeout(30000)});
   if(!r.ok)throw Error(category+' HTTP '+r.status);const products=await r.json();if(!Array.isArray(products))throw Error('Invalid product feed');
   for(const p of products){const price=Number(p.prices?.price)/10**Number(p.prices?.currency_minor_unit??2);if(!price||p.prices.currency_code!=='NPR'||!p.images?.length||used.has(p.permalink))continue;
    used.add(p.permalink);const slug='electronic-gh-'+p.id;const ext=new URL(p.images[0].src).pathname.match(/\.(png|webp|jpe?g)$/i)?.[0]||'.jpg';
    const item={sourceId:'gh-'+p.id,slug,name:clean(p.name),displayName:clean(p.name),price,currency:'NPR',source:p.permalink,imageUrl:p.images[0].src,image:'device-gh-'+p.id+ext,brand:clean(p.brands?.[0]?.name)||'See model',category,checked:today,features:[{label:'Category',value:def.name},...(p.attributes||[]).map(a=>({label:clean(a.name),value:(a.terms||[]).map(t=>clean(t.name)).join(', ')})).filter(a=>a.label&&a.value)].slice(0,15)};
    output.push(item);images.push(item);
   }
   if(products.length<100)break;
  }
  console.log(category,output.filter(p=>p.category===category).length);
 }
 let cursor=0;const failed=new Set();
 async function worker(){while(cursor<images.length){const p=images[cursor++];if(fs.existsSync(p.image))continue;try{const r=await fetch(p.imageUrl,{signal:AbortSignal.timeout(25000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('No photo');const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>4000000||bytes.length<1000)throw Error('Invalid image size');fs.writeFileSync(p.image,bytes);}catch(e){failed.add(p.slug);console.log('Skipped missing photo:',p.name);}}}
 await Promise.all(Array.from({length:6},worker));
 fs.writeFileSync('electronics-catalog.json',JSON.stringify(output.filter(p=>!failed.has(p.slug)),null,2));
 console.log('Imported',output.length-failed.size,'sourced electronics listings.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
