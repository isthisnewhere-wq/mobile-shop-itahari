'use strict';
const catalog = Array.isArray(window.EAKRAJ_CATALOG) ? window.EAKRAJ_CATALOG : [];
const bySlug = new Map(catalog.map(phone => [phone.slug, phone]));
const money = value => 'NRs. ' + new Intl.NumberFormat('en-IN').format(value);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
}
menuButton?.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// Real HTML cards remain usable without JavaScript; filters are a progressive enhancement.
const grid = document.querySelector('#products');
if (grid) {
  const cards = [...grid.querySelectorAll('.product-card')];
  const form = document.querySelector('#catalog-filters');
  const fields = {q:document.querySelector('#search'),brand:document.querySelector('#brand-filter'),budget:document.querySelector('#budget-filter'),tier:document.querySelector('#performance-filter'),sort:document.querySelector('#sort'),fiveg:document.querySelector('#fiveg-filter'),battery:document.querySelector('#battery-filter')};
  const perPage = 12;
  let page = 1, pageCount = 1;
  const pagination = document.querySelector('#pagination');
  function readURL() {
    const params = new URLSearchParams(window.location.search);
    Object.entries(fields).forEach(([name,field]) => {
      if (field.type === 'checkbox') field.checked = params.get(name) === '1';
      else if (field.tagName === 'SELECT') { const value=params.get(name); field.value=[...field.options].some(option=>option.value===value)?value:field.options[0].value; }
      else field.value=params.get(name)||'';
    });
    page=Math.max(1,Math.floor(Number(params.get('page')))||1);
  }
  function writeURL() {
    const params=new URLSearchParams();
    Object.entries(fields).forEach(([name,field])=>{
      if(field.type==='checkbox'){if(field.checked)params.set(name,'1');}
      else if(field.value&&!['All','all','featured'].includes(field.value))params.set(name,field.value);
    });
    if(page>1)params.set('page',String(page));
    history.replaceState(null,'',window.location.pathname+(params.size?'?'+params.toString():''));
  }
  function updateCatalog(updateURL=true) {
    const query=fields.q.value.trim().toLowerCase();
    const budget=fields.budget.value==='all'?[0,Infinity]:fields.budget.value.split('-').map(Number);
    const matches=cards.filter(card=>{const d=card.dataset;return(fields.brand.value==='All'||d.brand===fields.brand.value)&&d.name.includes(query)&&Number(d.price)>=budget[0]&&Number(d.price)<budget[1]&&(fields.tier.value==='All'||d.tier===fields.tier.value)&&(!fields.fiveg.checked||d.fiveg==='true')&&(!fields.battery.checked||Number(d.battery)>=5500);});
    matches.sort((a,b)=>{
      if(fields.sort.value==='price-low')return Number(a.dataset.price)-Number(b.dataset.price);
      if(fields.sort.value==='price-high')return Number(b.dataset.price)-Number(a.dataset.price);
      if(fields.sort.value==='name')return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
      return Number(a.dataset.order)-Number(b.dataset.order);
    });
    pageCount=Math.max(1,Math.ceil(matches.length/perPage));page=Math.min(page,pageCount);
    cards.forEach(card=>{card.hidden=true;});
    matches.forEach((card,index)=>{card.hidden=index<(page-1)*perPage||index>=page*perPage;grid.appendChild(card);});
    const start=matches.length?(page-1)*perPage+1:0,end=Math.min(page*perPage,matches.length);
    document.querySelector('#results-count').textContent=matches.length+(matches.length===1?' phone':' phones')+(matches.length?' · showing '+start+'–'+end:'');
    document.querySelector('#empty-state').hidden=matches.length>0;
    pagination.hidden=pageCount<=1;
    document.querySelector('#previous-page').disabled=page<=1;
    document.querySelector('#next-page').disabled=page>=pageCount;
    document.querySelector('#page-status').textContent='Page '+page+' of '+pageCount;
    if(updateURL)writeURL();
  }
  let searchTimer;
  fields.q.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{page=1;updateCatalog();},120);});
  Object.entries(fields).filter(([name])=>name!=='q').forEach(([,field])=>field.addEventListener('change',()=>{page=1;updateCatalog();}));
  form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(searchTimer);page=1;updateCatalog();});
  form.addEventListener('reset',()=>{clearTimeout(searchTimer);setTimeout(()=>{page=1;updateCatalog();fields.q.focus();},0);});
  function changePage(delta){page+=delta;updateCatalog();const result=document.querySelector('#results-count');result.setAttribute('tabindex','-1');result.focus({preventScroll:true});result.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  document.querySelector('#previous-page').addEventListener('click',()=>changePage(-1));
  document.querySelector('#next-page').addEventListener('click',()=>changePage(1));
  window.addEventListener('popstate',()=>{readURL();updateCatalog(false);});
  readURL();updateCatalog(false);
}

let selected=[];
try{const saved=JSON.parse(localStorage.getItem('eakraj-compare')||'[]');if(Array.isArray(saved))selected=[...new Set(saved)].filter(slug=>bySlug.has(slug)).slice(0,3);}catch{}
const comparisonSelects=[...document.querySelectorAll('.compare-select')];
if(comparisonSelects.length){const supplied=new URLSearchParams(window.location.search).get('phones');if(supplied!==null)selected=[...new Set(supplied.split(','))].filter(slug=>bySlug.has(slug)).slice(0,3);}
function saveSelection(){try{localStorage.setItem('eakraj-compare',JSON.stringify(selected));}catch{}}
function renderComparison(){
  const table=document.querySelector('#comparison-table');if(!table)return;
  const phones=selected.map(slug=>bySlug.get(slug));
  comparisonSelects.forEach((select,index)=>{select.value=selected[index]||'';});
  document.querySelector('#comparison-message').textContent=phones.length?phones.length+(phones.length===1?' phone selected. Add another to compare.':' phones selected. Reference prices and sourced specifications are shown below.'):'Choose up to three phones above, or use + Compare on any product card.';
  if(!phones.length){table.innerHTML='';return;}
  const rows=[['Starting reference price',p=>money(p.price)],['Priced variant',p=>p.variant],['Hardware class (estimated)',p=>p.tier],['Processor',p=>p.specs.chipset],['Display',p=>p.specs.display],['Memory',p=>p.specs.memory],['Rear cameras',p=>p.specs.camera],['Front camera',p=>p.specs.selfie],['Battery',p=>p.specs.battery],['Charging',p=>p.specs.charging],['Software',p=>p.specs.software],['Connectivity',p=>p.specs.connectivity],['Build',p=>p.specs.build]];
  table.innerHTML='<table class="data-table comparison"><caption>Phone specifications and Nepal reference prices</caption><thead><tr><th scope="col">Feature</th>'+phones.map(p=>'<th scope="col"><a href="'+p.slug+'.html"><img src="'+p.image+'" alt="'+escapeHTML(p.name)+'" width="140" height="100">'+escapeHTML(p.name)+'</a></th>').join('')+'</tr></thead><tbody>'+rows.map(([label,value])=>'<tr><th scope="row">'+label+'</th>'+phones.map(p=>'<td>'+escapeHTML(value(p)||'Not confirmed in source')+'</td>').join('')+'</tr>').join('')+'<tr><th scope="row">Explore</th>'+phones.map(p=>'<td><a href="'+p.slug+'.html#review">Read buying overview →</a></td>').join('')+'</tr></tbody></table>';
}
function updateSelection(){
  saveSelection();
  document.querySelectorAll('[data-compare]').forEach(button=>{const active=selected.includes(button.dataset.compare);button.setAttribute('aria-pressed',String(active));button.textContent=active?'✓ Selected':'+ Compare';});
  const tray=document.querySelector('#compare-tray');
  if(tray){tray.hidden=selected.length===0||comparisonSelects.length>0;document.querySelector('#compare-status').textContent=selected.length+'/3 selected: '+selected.map(slug=>bySlug.get(slug).name).join(', ');document.querySelector('#compare-link').href='compare.html?phones='+encodeURIComponent(selected.join(','));}
  if(comparisonSelects.length){const params=new URLSearchParams();if(selected.length)params.set('phones',selected.join(','));history.replaceState(null,'',window.location.pathname+(params.size?'?'+params.toString():''));renderComparison();}
}
document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>{
  const slug=button.dataset.compare;if(!bySlug.has(slug))return;
  if(selected.includes(slug))selected=selected.filter(value=>value!==slug);
  else if(selected.length<3)selected.push(slug);
  else{document.querySelector('#compare-status').textContent='Compare up to 3 phones. Deselect one or clear the selection to add another.';return;}
  updateSelection();
}));
comparisonSelects.forEach(select=>select.addEventListener('change',()=>{const values=comparisonSelects.map(field=>field.value).filter(Boolean);if(new Set(values).size!==values.length){renderComparison();document.querySelector('#comparison-message').textContent='That phone is already selected. Choose a different model.';return;}selected=values.filter(slug=>bySlug.has(slug));updateSelection();}));
document.querySelector('#clear-compare')?.addEventListener('click',()=>{selected=[];updateSelection();});
updateSelection();

const variant=document.querySelector('#variant-select');
if(variant){const phone=bySlug.get(variant.dataset.product);function updateVariant(){const option=variant.selectedOptions[0];document.querySelector('#variant-price').textContent=money(Number(option.dataset.price));document.querySelector('#variant-enquiry').href='https://wa.me/9779707293923?text='+encodeURIComponent('Hi Eakraj Mobile Shop, please confirm price, stock, and warranty for '+phone.name+' ('+option.value+').');}if(phone){variant.addEventListener('change',updateVariant);updateVariant();}}
const enquiryForm=document.querySelector('#enquiry-form');
if(enquiryForm){const messageField=document.querySelector('#enquiry-message');enquiryForm.addEventListener('submit',event=>{event.preventDefault();const name=document.querySelector('#enquiry-name').value.trim(),interest=document.querySelector('#enquiry-interest').value,message=messageField.value.trim();if(!message){messageField.setCustomValidity('Please enter your question.');enquiryForm.reportValidity();return;}const text='Hi Eakraj Mobile Shop,'+(name?' I am '+name+'.':'')+'\nI am interested in: '+interest+'\n'+message;window.location.href='https://wa.me/9779707293923?text='+encodeURIComponent(text);});messageField.addEventListener('input',()=>messageField.setCustomValidity(''));}
