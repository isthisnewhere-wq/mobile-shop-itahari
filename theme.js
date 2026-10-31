(() => {
  'use strict';
  const brandSearch=document.querySelector('#brand-search');
  if(brandSearch){
    brandSearch.addEventListener('input',()=>{
      const q=brandSearch.value.trim().toLowerCase();let models=0,brands=0;
      document.querySelectorAll('.brand-model-group').forEach(group=>{
        let visible=0;
        group.querySelectorAll('[data-model]').forEach(link=>{link.hidden=!link.dataset.model.includes(q);if(!link.hidden)visible++;});
        group.hidden=!visible;if(visible){models+=visible;brands++;}
      });
      document.querySelector('#brand-search-status').textContent=`${models} models across ${brands} brands`;
      document.querySelector('.brand-empty').hidden=models!==0;
      document.querySelectorAll('.brand-jump a').forEach(link=>{link.hidden=!!q&&!link.textContent.toLowerCase().includes(q);});
    });
  }
  const toggle=document.querySelector('.filters-toggle');
  const filters=document.querySelector('#catalog-filters, #store-filters');
  if(toggle&&filters){
    toggle.addEventListener('click',()=>{
      const open=filters.classList.toggle('filters-open');
      toggle.setAttribute('aria-expanded',String(open));
    });
  }
  const departments=document.querySelector('.department-menu');
  document.addEventListener('click',event=>{if(departments&&!event.target.closest('.department-menu'))departments.open=false;});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&departments?.open){departments.open=false;departments.querySelector('summary').focus();}
  });
})();
