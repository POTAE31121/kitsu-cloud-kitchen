// ===============================================
// CONFIG
// ===============================================
const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';
const CART_KEY = 'kitsuCart';

let allMenuItems = [];

// ===============================================
// BOOTSTRAP
// ===============================================
document.addEventListener('DOMContentLoaded', async () => {
  initializeStaticComponents();
  initializeGlobalEventListeners();

  if (document.querySelector('.menu-grid')) {
    await loadMenu(); // ✅ ต้องโหลดเมนูก่อน
  }

  renderCart(); // ✅ ค่อย render cart ทีหลัง
});

// ===============================================
// MENU
// ===============================================
async function loadMenu() {
  const container = document.querySelector('.menu-grid');
  if (!container) return;

  container.innerHTML = `<p class="loading-message">กำลังโหลดเมนู...</p>`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/items/`);
    if (!res.ok) throw new Error(res.status);

    allMenuItems = await res.json();
    container.innerHTML = '';

    allMenuItems.forEach(item => {
      container.insertAdjacentHTML('beforeend', `
        <div class="menu-card">
          <img src="${item.image_url || 'https://via.placeholder.com/150'}">
          <h3>${item.name}</h3>
          <p>${item.price} บาท</p>
          <button class="add-to-cart-btn" data-id="${item.id}">
            เพิ่มลงตะกร้า
          </button>
        </div>
      `);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="error">โหลดเมนูไม่สำเร็จ</p>`;
  }
}

// ===============================================
// CART – STATE
// ===============================================
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ===============================================
// CART – ACTIONS
// ===============================================
function addToCart(id) {
  const product = allMenuItems.find(p => String(p.id) === String(id));
  if (!product) {
    console.error('Product not found:', id);
    return;
  }

  const cart = getCart();
  const item = cart.find(i => i.id == id);

  if (item) {
    item.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  saveCart(cart);
  renderCart();
}

function decreaseItem(id) {
  let cart = getCart();
  const item = cart.find(i => i.id == id);
  if (!item) return;

  item.quantity--;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id != id);
  }

  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  const cart = getCart().filter(i => i.id != id);
  saveCart(cart);
  renderCart();
}

// ===============================================
// CART – RENDER
// ===============================================
function renderCart() {
  const cart = getCart();
  const list = document.getElementById('modal-cart-items');
  const totalEl = document.getElementById('modal-cart-total');
  const badges = document.querySelectorAll('.cart-badge');
  const fab = document.getElementById('cart-fab');

  if (!list || !totalEl) return;

  list.innerHTML = '';

  if (cart.length === 0) {
    list.innerHTML = `<p class="empty-cart">ยังไม่มีสินค้าในตะกร้า</p>`;
    totalEl.textContent = '0.00';
    badges.forEach(b => b.classList.add('hidden'));
    fab?.classList.add('hidden');
    return;
  }

  let total = 0;
  let qty = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
    qty += item.quantity;

    list.insertAdjacentHTML('beforeend', `
      <div class="cart-item">
        <span>${item.name}</span>
        <div class="cart-controls">
          <button data-action="increase" data-id="${item.id}">+</button>
          <span>${item.quantity}</span>
          <button data-action="decrease" data-id="${item.id}">-</button>
          <button data-action="remove" data-id="${item.id}">×</button>
        </div>
      </div>
    `);
  });

  totalEl.textContent = total.toFixed(2);
  badges.forEach(b => {
    b.textContent = qty;
    b.classList.toggle('hidden', qty === 0);
  });
  fab?.classList.remove('hidden');
}

// ===============================================
// EVENT DELEGATION (SINGLE SOURCE OF TRUTH)
// ===============================================
function initializeGlobalEventListeners() {
  document.addEventListener('click', e => {

    // ADD TO CART (MENU)
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      addToCart(addBtn.dataset.id);
      return;
    }

    // CART CONTROLS
    const cartBtn = e.target.closest('[data-action]');
    if (!cartBtn) return;

    const { action, id } = cartBtn.dataset;
    if (!id) return;

    if (action === 'increase') addToCart(id);
    if (action === 'decrease') decreaseItem(id);
    if (action === 'remove') removeItem(id);
  });
}

// ===============================================
// MODALS / STATIC
// ===============================================
function initializeStaticComponents() {
  initializeCartModal();
  initializeCheckoutModal();
}

function initializeCartModal() {
  const modal = document.getElementById('cart-modal');
  const overlay = document.getElementById('cart-modal-overlay');

  document.getElementById('cart-icon')?.addEventListener('click', open);
  document.getElementById('cart-fab')?.addEventListener('click', open);
  document.getElementById('modal-close-btn')?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  function open() {
    modal?.classList.remove('hidden');
    overlay?.classList.remove('hidden');
  }
  function close() {
    modal?.classList.add('hidden');
    overlay?.classList.add('hidden');
  }
}

function initializeCheckoutModal() {
  document
    .querySelector('#cart-modal .checkout-btn')
    ?.addEventListener('click', () => {
      if (getCart().length === 0) {
        alert('ตะกร้าว่าง');
        return;
      }
      document.getElementById('checkout-modal')?.classList.remove('hidden');
      document.getElementById('checkout-modal-overlay')?.classList.remove('hidden');
    });
}
