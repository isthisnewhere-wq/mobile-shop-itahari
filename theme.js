(() => {
  'use strict';
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
