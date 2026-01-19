// ==================================================
//              CONFIG
// ==================================================
const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';
const CART_KEY = 'kitsuCart';

// ==================================================
//              STATE
// ==================================================
let allMenuItems = [];

// ==================================================
//              BOOTSTRAP
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initMobileMenu();
  initSharedComponents();
  initPageSpecific();
}

// ==================================================
//              PAGE DETECTION
// ==================================================
function initPageSpecific() {
  if (document.querySelector('.menu-grid')) {
    loadMenuItems();
  }

  if (document.getElementById('track-order-btn')) {
    initializeOrderStatusPage?.();
  }
}

// ==================================================
//              MENU
// ==================================================
async function loadMenuItems() {
  const container = document.querySelector('.menu-grid');
  if (!container) return;

  container.textContent = 'กำลังโหลด...';

  try {
    const res = await fetch(`${API_BASE_URL}/api/items/`);
    if (!res.ok) throw new Error('Fetch menu failed');

    allMenuItems = await res.json();
    container.innerHTML = '';

    allMenuItems.forEach(renderMenuItem);
  } catch (err) {
    console.error(err);
    container.textContent = 'โหลดข้อมูลไม่สำเร็จ';
  }
}

function renderMenuItem(item) {
  document.querySelector('.menu-grid')?.insertAdjacentHTML(
    'beforeend',
    `
    <div class="menu-card">
      <img src="${item.image_url}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>฿${item.price}</p>
      <button class="add-to-cart-btn" data-id="${item.id}">
        เพิ่มลงตะกร้า
      </button>
    </div>
    `
  );
}

// ==================================================
//              CART CORE
// ==================================================
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const product = allMenuItems.find(p => p.id == id);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(i => i.id == id);

  existing ? existing.quantity++ : cart.push({
    id,
    name: product.name,
    price: product.price,
    quantity: 1
  });

  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id != id);
  saveCart(cart);
  renderCart();
}

// ==================================================
//              CART UI
// ==================================================
function renderCart() {
  const cart = getCart();

  const itemsEl = document.getElementById('modal-cart-items');
  const totalEl = document.getElementById('modal-cart-total');
  const fab = document.getElementById('cart-fab');
  const badges = document.querySelectorAll('.cart-badge');

  if (!itemsEl || !totalEl) return;

  let total = 0;
  let qty = 0;

  itemsEl.innerHTML = '';

  cart.forEach(item => {
    total += item.price * item.quantity;
    qty += item.quantity;

    itemsEl.insertAdjacentHTML('beforeend', `
      <div class="cart-item">
        <span>${item.name} x${item.quantity}</span>
        <button class="remove-from-cart-btn" data-id="${item.id}">×</button>
      </div>
    `);
  });

  totalEl.textContent = total.toFixed(2);

  badges.forEach(b => {
    b.textContent = qty;
    b.classList.toggle('hidden', qty === 0);
  });

  fab?.classList.toggle('hidden', qty === 0);
}

// ==================================================
//              MODALS
// ==================================================
function initSharedComponents() {
  initCartModal();
  initCheckoutModal();
  initGlobalEvents();
  renderCart();
}

function initCartModal() {
  const modal = document.getElementById('cart-modal');
  const overlay = document.getElementById('cart-modal-overlay');

  const open = () => toggleModal(modal, overlay, true);
  const close = () => toggleModal(modal, overlay, false);

  document.getElementById('cart-icon')?.addEventListener('click', open);
  document.getElementById('cart-fab')?.addEventListener('click', open);
  document.getElementById('modal-close-btn')?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
}

function initCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const overlay = document.getElementById('checkout-modal-overlay');
  const form = document.getElementById('checkout-form');

  const open = () => toggleModal(modal, overlay, true);
  const close = () => toggleModal(modal, overlay, false);

  document.querySelector('#cart-modal .checkout-btn')
    ?.addEventListener('click', () => {
      if (!getCart().length) return alert('ตะกร้าว่าง');
      open();
    });

  document.getElementById('checkout-close-btn')?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  form?.addEventListener('submit', handleOrderSubmit);
}

function toggleModal(modal, overlay, show) {
  modal?.classList.toggle('hidden', !show);
  overlay?.classList.toggle('hidden', !show);
  document.body.style.overflow = show ? 'hidden' : '';
}

// ==================================================
//              PAYMENT FLOW
// ==================================================
async function handleOrderSubmit(e) {
  e.preventDefault();

  const cart = getCart();
  if (!cart.length) return alert('ตะกร้าว่าง');

  try {
    const orderRes = await fetch(`${API_BASE_URL}/api/orders/submit-final/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: valueOf('customer_name'),
        customer_phone: valueOf('customer_phone'),
        customer_address: valueOf('customer_address'),
        items: JSON.stringify(cart.map(i => ({
          id: Number(i.id),
          quantity: Number(i.quantity)
        })))
      })
    });

    if (!orderRes.ok) throw new Error(await orderRes.text());
    const { order_id, total_price } = await orderRes.json();

    const payRes = await fetch(`${API_BASE_URL}/api/payment/create-intent/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id, amount: total_price })
    });

    if (!payRes.ok) throw new Error('Payment intent failed');
    const { simulator_url } = await payRes.json();

    window.location.href = simulator_url;

  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาด');
  }
}

function valueOf(id) {
  return document.getElementById(id)?.value || '';
}

// ==================================================
//              GLOBAL EVENTS
// ==================================================
function initGlobalEvents() {
  document.addEventListener('click', e => {
    const add = e.target.closest('.add-to-cart-btn');
    const remove = e.target.closest('.remove-from-cart-btn');

    if (add) {
      addToCart(add.dataset.id);
      feedback(add);
    }

    if (remove) {
      removeFromCart(remove.dataset.id);
    }
  });
}

function feedback(btn) {
  const text = btn.textContent;
  btn.textContent = 'เพิ่มแล้ว ✓';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = text;
    btn.disabled = false;
  }, 700);
}

// ==================================================
//              MOBILE MENU
// ==================================================
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const menu = document.getElementById('slide-menu');

  if (!hamburger || !menu) return;

  hamburger.addEventListener('click', () => {
    menu.classList.toggle('open');
    document.body.style.overflow = 'hidden';
  });

  menu.addEventListener('click', e => {
    if (e.target.tagName === 'A') closeMenu();
  });

  function closeMenu() {
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }
}
