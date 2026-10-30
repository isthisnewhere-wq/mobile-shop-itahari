'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();

const grid = document.querySelector('#products');
if (grid) {
  const cards = Array.from(grid.querySelectorAll('.product-card'));
  const search = document.querySelector('#search');
  const sort = document.querySelector('#sort');
  const filters = document.querySelectorAll('[data-filter]');
  let brand = 'All';
  function updateCatalog() {
    const query = search.value.trim().toLowerCase();
    const sorted = [...cards].sort((a, b) => {
      if (sort.value === 'price-low') return Number(a.dataset.price) - Number(b.dataset.price);
      if (sort.value === 'price-high') return Number(b.dataset.price) - Number(a.dataset.price);
      if (sort.value === 'name') return a.dataset.name.localeCompare(b.dataset.name);
      return Number(a.dataset.order) - Number(b.dataset.order);
    });
    let count = 0;
    sorted.forEach(card => {
      card.hidden = !((brand === 'All' || card.dataset.brand === brand) && (card.dataset.name + ' ' + card.dataset.brand.toLowerCase()).includes(query));
      if (!card.hidden) count++;
      grid.appendChild(card);
    });
    document.querySelector('#results-count').textContent = count + (count === 1 ? ' phone' : ' phones');
    document.querySelector('#empty-state').hidden = count > 0;
    filters.forEach(button => {
      const active = button.dataset.filter === brand;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  filters.forEach(button => button.addEventListener('click', () => { brand = button.dataset.filter; updateCatalog(); }));
  search.addEventListener('input', updateCatalog);
  sort.addEventListener('change', updateCatalog);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    brand = 'All'; search.value = ''; sort.value = 'featured'; updateCatalog(); search.focus();
  });
}

const enquiryForm = document.querySelector('#enquiry-form');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#enquiry-name').value.trim();
    const interest = document.querySelector('#enquiry-interest').value;
    const message = document.querySelector('#enquiry-message').value.trim();
    if (!message) { document.querySelector('#enquiry-message').setCustomValidity('Please enter your question.'); enquiryForm.reportValidity(); return; }
    const text = 'Hi Eakraj Mobile Shop,' + (name ? ' I am ' + name + '.' : '') + '\nI am interested in: ' + interest + '\n' + message;
    window.location.href = 'https://wa.me/9779707293923?text=' + encodeURIComponent(text);
  });
  document.querySelector('#enquiry-message').addEventListener('input', event => event.target.setCustomValidity(''));
}
