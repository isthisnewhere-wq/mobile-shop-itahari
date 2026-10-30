const products = [
  { name: 'iPhone 16', brand: 'Apple', detail: 'A fresh perspective. All day.', color: '#7e8eaa', light: '#c0cbdc', badge: 'Fan favourite', mark: 'Apple', description: 'Discover the iPhone experience, with an elegant design and a camera ready for everyday moments.' },
  { name: 'Galaxy S25 Ultra', brand: 'Samsung', detail: 'More power. More possibility.', color: '#92948c', light: '#deded3', badge: 'Premium pick', mark: 'SAMSUNG', description: 'Explore Samsung’s premium Galaxy range for photography, productivity, and creativity.' },
  { name: 'Redmi Note 14', brand: 'Xiaomi', detail: 'Big on the everyday.', color: '#86a79b', light: '#d4e3d4', badge: 'Everyday essential', mark: 'Redmi', description: 'Meet an everyday smartphone built around the things you enjoy, from streaming to staying connected.' },
  { name: 'Galaxy A56', brand: 'Samsung', detail: 'A little more awesome.', color: '#a49cb1', light: '#dbd5e6', badge: 'Worth a look', mark: 'SAMSUNG', description: 'Discover the Galaxy A series, combining a clean design with everyday features.' }
];
const grid = document.querySelector('#products');
const search = document.querySelector('#search');
const filters = document.querySelectorAll('[data-brand]');
const dialog = document.querySelector('#product-dialog');
let selectedBrand = 'All';

function renderProducts() {
  const query = search.value.trim().toLowerCase();
  const matches = products.filter(product => (selectedBrand === 'All' || product.brand === selectedBrand) && `${product.name} ${product.brand}`.toLowerCase().includes(query));
  grid.innerHTML = matches.map(product => `<article class="product-card">
    <div class="product-art" role="img" aria-label="Stylized illustration of ${product.name}"><span class="product-badge">${product.badge}</span><div class="mini-phone" style="--phone-color:${product.color};--phone-light:${product.light}" data-mark="${product.mark}"></div></div>
    <div class="product-info"><span class="brand">${product.brand}</span><h3>${product.name}</h3><p>${product.detail}</p><div class="product-bottom"><span>Enquire in store</span><button class="details-button" data-product="${product.name}" aria-label="View ${product.name} details">↗</button></div></div>
  </article>`).join('');
  document.querySelector('#empty-state').hidden = matches.length > 0;
}

filters.forEach(button => button.addEventListener('click', () => {
  selectedBrand = button.dataset.brand;
  filters.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('selected', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  renderProducts();
}));
search.addEventListener('input', renderProducts);
grid.addEventListener('click', event => {
  const button = event.target.closest('[data-product]');
  if (!button) return;
  const product = products.find(item => item.name === button.dataset.product);
  document.querySelector('#dialog-title').textContent = product.name;
  document.querySelector('#dialog-description').textContent = product.description;
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-visit').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});
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
document.querySelector('#year').textContent = new Date().getFullYear();
renderProducts();
