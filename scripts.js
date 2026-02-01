// ===============================================
// KITSU CLOUD KITCHEN - CLEAN & STABLE
// ===============================================

const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';
let allMenuItems = [];

// ===============================================
// INIT
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initCartEvents();
  renderCart();
});

// ===============================================
// MENU
// ===============================================
async function initMenu() {
  const grid = document.querySelector('.menu-grid');
  if (!grid) return;

  grid.innerHTML = '<p>กำลังโหลดเมนู...</p>';

  try {
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
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p>โหลดเมนูไม่สำเร็จ</p>';
  }
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
  if (!id) return;

  const product = allMenuItems.find(p => String(p.id) === String(id));
  if (!product) return;

  const cart = getCart();
  const found = cart.find(i => i.id === product.id);

  if (found) {
    found.quantity += 1;
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
  const badges = document.querySelectorAll('.cart-badge');
  const fab = document.getElementById('cart-fab');

  if (!list || !totalEl) return;

  list.innerHTML = '';
  let total = 0;
  let qty = 0;

  if (cart.length === 0) {
    list.innerHTML = '<p>ยังไม่มีสินค้าในตะกร้า</p>';
    totalEl.textContent = '0.00';
    badges.forEach(b => b.classList.add('hidden'));
    fab?.classList.add('hidden');
    return;
  }

  cart.forEach(item => {
    if (!item || !item.price) return;

    total += item.price * item.quantity;
    qty += item.quantity;

    list.insertAdjacentHTML('beforeend', `
      <div class="cart-item">
        ${item.name} × ${item.quantity}
      </div>
    `);
  });

  totalEl.textContent = total.toFixed(2);
  badges.forEach(b => {
    b.textContent = qty;
    b.classList.remove('hidden');
  });
  fab?.classList.remove('hidden');
}

// ===============================================
// EVENTS (ONE SOURCE OF TRUTH)
// ===============================================
function initCartEvents() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;

    const id = btn.dataset.id;
    addToCart(id);

    btn.textContent = 'เพิ่มแล้ว ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'เพิ่มลงตะกร้า';
      btn.disabled = false;
    }, 600);
  });
}
