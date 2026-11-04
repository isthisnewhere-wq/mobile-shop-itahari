const assert=require('node:assert/strict'),fs=require('node:fs');
const {update}=require('./refresh-prices.cjs');
const p={slug:'test-device',price:10000,checked:'2026-01-01',source:'https://example.com/model',discountPercent:10},h={};
update(p,9000,h);assert.equal(h[p.slug][0].price,10000);assert.equal(h[p.slug][1].price,9000);assert.equal(p.proposedPrice,8100);assert.equal(p.savings,900);
update(p,11000,h);assert.equal(h[p.slug].at(-1).price,11000);assert.equal(p.proposedPrice,9900);assert.equal(p.savings,1100);
update(p,11000,h);assert.equal(h[p.slug].length,3);assert.throws(()=>update(p,0,h));assert.throws(()=>update(p,NaN,h));
const history=JSON.parse(fs.readFileSync('price-history.json'));
for(const file of ['catalog.json','store-catalog.json','electronics-catalog.json'])for(const p of JSON.parse(fs.readFileSync(file))){assert(p.price>0);assert.equal(history[p.slug].at(-1).price,p.price);}
console.log('PASS: real price decreases, increases, unchanged quotes, invalid-quote rejection, correct proposed discounts, and history/catalog consistency.');
