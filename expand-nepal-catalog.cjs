/* Include the remaining researched Nepal price-list models without removing public URLs. */
const fs=require('node:fs'),vm=require('node:vm');
async function main(){
 const current=JSON.parse(fs.readFileSync('catalog.json'));
 const researched=JSON.parse(fs.readFileSync('catalog-candidates.json'));
 const source=fs.readFileSync('prepare-catalog.cjs','utf8');
 const assess=vm.runInNewContext('('+source.slice(source.indexOf('function assessment('),source.indexOf('for (const p of chosen) p.assessment'))+')');
 for(const item of researched){
  if(current.some(p=>p.source===item.source||p.name.toLowerCase()===item.name.toLowerCase()))continue;
  const p={...item};p.price=Math.min(...p.variants.map(v=>v.price));p.variant=p.variants.find(v=>v.price===p.price).label;
  p.image='phone-'+p.slug+'.jpg';p.assessment=assess(p);
  if(!fs.existsSync(p.image)){
   const r=await fetch(p.imageUrl,{signal:AbortSignal.timeout(25000)});
   if(!r.ok||!r.headers.get('content-type')?.includes('image'))throw Error('Photo unavailable: '+p.name);
   fs.writeFileSync(p.image,Buffer.from(await r.arrayBuffer()));
  }
  current.push(p);console.log('Added',p.name);
 }
 fs.writeFileSync('catalog.json',JSON.stringify(current,null,2));
 console.log('Nepal catalog:',current.length,'models');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
