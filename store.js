/* Department filters and pagination, isolated from the smartphone catalog. */
(() => {
  'use strict';
  const grid=document.querySelector('#store-products');
  if(!grid)return;
  const cards=[...grid.querySelectorAll('.store-card')];
  const form=document.querySelector('#store-filters');
  const fields={q:document.querySelector('#store-search'),brand:document.querySelector('#store-brand'),department:document.querySelector('#store-category'),budget:document.querySelector('#store-budget'),sort:document.querySelector('#store-sort')};
  const pageSize=12;
  let page=1,pageCount=1,timer;
  function readURL(){
    const params=new URLSearchParams(window.location.search);
    for(const[name,field]of Object.entries(fields)){
      const value=params.get(name);
      if(field.tagName==='SELECT')field.value=[...field.options].some(option=>option.value===value)?value:field.options[0].value;
      else field.value=value||'';
    }
    page=Math.max(1,Math.floor(Number(params.get('page')))||1);
  }
  function update(updateURL=true){
    const query=fields.q.value.trim().toLowerCase();
    const range=fields.budget.value==='all'?[0,Infinity]:fields.budget.value.split('-').map(Number);
    const matches=cards.filter(card=>{const d=card.dataset;return d.storeName.includes(query)&&(fields.brand.value==='All'||d.storeBrand===fields.brand.value)&&(fields.department.value==='All'||d.storeCategory===fields.department.value)&&Number(d.storePrice)>=range[0]&&Number(d.storePrice)<range[1];});
    matches.sort((a,b)=>{
      if(fields.sort.value==='price-low')return Number(a.dataset.storePrice)-Number(b.dataset.storePrice);
      if(fields.sort.value==='price-high')return Number(b.dataset.storePrice)-Number(a.dataset.storePrice);
      if(fields.sort.value==='name')return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
      return Number(a.dataset.storeOrder)-Number(b.dataset.storeOrder);
    });
    pageCount=Math.max(1,Math.ceil(matches.length/pageSize));page=Math.min(page,pageCount);
    cards.forEach(card=>{card.hidden=true;});
    matches.forEach((card,index)=>{card.hidden=index<(page-1)*pageSize||index>=page*pageSize;grid.appendChild(card);});
    const start=matches.length?(page-1)*pageSize+1:0,end=Math.min(page*pageSize,matches.length);
    document.querySelector('#store-results').textContent=matches.length+(matches.length===1?' product':' products')+(matches.length?' · showing '+start+'–'+end:'');
    document.querySelector('#store-empty').hidden=matches.length>0;
    document.querySelector('#store-pagination').hidden=pageCount<=1;
    document.querySelector('#store-previous').disabled=page<=1;
    document.querySelector('#store-next').disabled=page>=pageCount;
    document.querySelector('#store-page').textContent='Page '+page+' of '+pageCount;
    if(updateURL){const params=new URLSearchParams();for(const[name,field]of Object.entries(fields))if(field.value&&!['All','all','featured'].includes(field.value))params.set(name,field.value);if(page>1)params.set('page',String(page));history.replaceState(null,'',window.location.pathname+(params.size?'?'+params.toString():''));}
  }
  fields.q.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{page=1;update();},120);});
  for(const[name,field]of Object.entries(fields))if(name!=='q')field.addEventListener('change',()=>{page=1;update();});
  form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(timer);page=1;update();});
  form.addEventListener('reset',()=>{clearTimeout(timer);setTimeout(()=>{page=1;update();fields.q.focus();},0);});
  function move(delta){page+=delta;update();const result=document.querySelector('#store-results');result.setAttribute('tabindex','-1');result.focus({preventScroll:true});result.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  document.querySelector('#store-previous').addEventListener('click',()=>move(-1));
  document.querySelector('#store-next').addEventListener('click',()=>move(1));
  window.addEventListener('popstate',()=>{readURL();update(false);});
  readURL();update(false);
})();
