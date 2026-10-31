const fs=require('node:fs');
const products=JSON.parse(fs.readFileSync('store-catalog.json','utf8'));
const research=Object.values(JSON.parse(fs.readFileSync('store-research.json','utf8'))).flat();
const decode=s=>String(s||'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([a-f0-9]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
const labels=['Brand','Model','Product Type','Keyboard Type','Layout','Number of Keys','Mounting Structure','Switch Type','Hot-Swap Support','Hot Swap','Connectivity','Connection','Wireless Range','Battery Capacity','Battery Life with ANC','Battery Life','Backlighting','Keycaps','Control','Controls','Software','Dimensions','Weight','Driver Size','Driver','Drivers','Noise Cancellation','Noise Reduction','Audio Certification','Bluetooth Audio Codec','Sound Personalization','Equalizer','Microphones','Microphone','Microphone Sensitivity','Bluetooth Version','Bluetooth','Multipoint Connectivity','Charging','Fast Charging','Water Resistance','Companion App','Frequency Response','Frequency','Form Factor','Sensitivity','Impedance','Interface','Type','Capacity','Material','Compatibility','Compatible With','Power','Output Power','Input','Output','RAM','Memory','Storage','Processor','CPU','GPU','Graphics','Display','Screen','Operating System','OS','Ports','Warranty','Color'];
const pattern=new RegExp('(?:^|\\s)('+labels.sort((a,b)=>b.length-a.length).join('|')+')\\s*:\\s*','gi');
for(const p of products){
 p.name=decode(p.name);p.attributes=p.attributes.map(a=>({label:decode(a.label),value:decode(a.value)}));
 const source=research.find(x=>x.sourceId===p.sourceId),text=decode(source?.shortDescription||'');
 const matches=[...text.matchAll(pattern)];
 p.features=[];
 for(let i=0;i<matches.length;i++){const label=matches[i][1],value=text.slice(matches[i].index+matches[i][0].length,matches[i+1]?.index??text.length).trim();if(value&&value.length<350&&!/^not specified/i.test(value)&&!/^warranty$/i.test(label))p.features.push({label,value});}
 p.features=p.features.slice(0,12);
 const brand=(p.attributes.find(a=>/^brand$/i.test(a.label))||p.features.find(a=>/^brand$/i.test(a.label)))?.value;
 p.brand=brand||p.name.split(' ')[0];
 if(/^mivi$/i.test(p.brand))p.brand='Mivi';
 if(/^boat$/i.test(p.brand))p.brand='boAt';
 p.displayName=p.name.split(/\s+[|]\s+/)[0].replace(/:.*$/,'').trim();
 if(p.displayName.length>100)p.displayName=p.displayName.slice(0,97)+'…';
 if((p.displayName.match(/\(/g)||[]).length>(p.displayName.match(/\)/g)||[]).length)p.displayName+=')';
 const laptopTitles={'gh-14588':'Acer Predator Helios Neo 16 (Core i7, RTX 4060)','gh-14586':'Lenovo Legion 5 (Ryzen 7, RTX 4060)','gh-14019':'Apple MacBook Pro 2023 (M2 Pro, 16GB / 512GB)','gh-14017':'Apple MacBook Pro 14 (M3 Pro, 18GB / 1TB)','gh-14002':'Apple MacBook Air 13.6 (M2, 8GB / 512GB)','gh-13756':'Acer Nitro 16 (Ryzen 7, RTX 4050)','gh-13753':'Acer Nitro V (Core i5, RTX 4050)','gh-13722':'Acer Aspire 5 (Core i5, 8GB / 512GB)','gh-13720':'Acer Nitro V 15 (Core i5, RTX 3050)','gh-13704':'Lenovo LOQ 2023 (Ryzen 7, RTX 4050)'};
 if(p.category==='laptops'&&laptopTitles[p.sourceId])p.displayName=laptopTitles[p.sourceId];
 if(p.category==='laptops'){p.discountPercent=10;p.proposedPrice=Math.round(p.price*90)/100;p.savings=Math.round((p.price-p.proposedPrice)*100)/100;}
}
fs.writeFileSync('store-catalog.json',JSON.stringify(products,null,2));
console.log('Prepared factual feature fields for',products.length,'products.');
async function images(){let errors=[];for(const p of products){if(fs.existsSync(p.image))continue;try{const r=await fetch(p.imageUrl,{signal:AbortSignal.timeout(20000)});const b=Buffer.from(await r.arrayBuffer());const valid=b.subarray(0,2).equals(Buffer.from([255,216]))||b.subarray(1,4).toString()==='PNG'||b.subarray(0,4).toString()==='RIFF'||b.subarray(0,3).toString()==='GIF'||(b.subarray(4,8).toString()==='ftyp'&&/avif|avis/.test(b.subarray(8,32).toString()));if(!r.ok||!valid)throw Error('Invalid photo response '+r.status);fs.writeFileSync(p.image,b);console.log('Photo saved:',p.slug);}catch(e){errors.push({slug:p.slug,error:e.message});}await new Promise(r=>setTimeout(r,150));}fs.writeFileSync('store-image-errors.json',JSON.stringify(errors,null,2));console.log('Remaining photo errors:',errors.length);if(errors.length)process.exitCode=1;}
images().catch(e=>{console.error(e);process.exitCode=1});
