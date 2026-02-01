// ===============================================
// KITSU CLOUD KITCHEN - CLEAN STABLE VERSION
// ===============================================

const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';
let allMenuItems = [];

// ===============================================
// INIT
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
  initCart();
  if (document.querySelector('.menu-grid')) loadMenu();
});

// ===============================================
// MENU
// ===============================================
async function loadMenu() {
  const grid = document.querySelector('.menu-grid');
  grid.innerHTML = '<p>กำลังโหลดเมนู...</p>';

  const res = await fetch(`${API_BASE_URL}/api/items/`);
  const items = await res.json();

  allMenuItems = items;
  grid.innerHTML = '';

  items.forEach(item => {
    grid.insertAdjacentHTML('beforeend', `
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
}

// ===============================================
// CART STORAGE
// ===============================================
function getCart() {
  return JSON.parse(localStorage.getItem('kitsuCart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('kitsuCart', JSON.stringify(cart));
}

// ===============================================
// CART LOGIC
// ===============================================
function addToCart(id) {
  const product = allMenuItems.find(p => p.id == id);
  if (!product) return;

  const cart = getCart();
  const found = cart.find(i => i.id == id);

  if (found) {
    found.quantity++;
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

function renderCart() {
  const cart = getCart();
  const list = document.getElementById('modal-cart-items');
  const totalEl = document.getElementById('modal-cart-total');

  if (!list || !totalEl) return;

  list.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    list.innerHTML = '<p>ยังไม่มีสินค้าในตะกร้า</p>';
    totalEl.textContent = '0.00';
    return;
  }

  cart.forEach(item => {
    total += item.price * item.quantity;
    list.insertAdjacentHTML('beforeend', `
      <div class="cart-item">
        ${item.name} x ${item.quantity}
      </div>
    `);
  });

  totalEl.textContent = total.toFixed(2);
}

// ===============================================
// EVENTS (ONE PLACE ONLY)
// ===============================================
function initCart() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    addToCart(id);

    btn.textContent = 'เพิ่มแล้ว ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'เพิ่มลงตะกร้า';
      btn.disabled = false;
    }, 600);
  });

  renderCart();
}
