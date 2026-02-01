// ===============================================
//           MASTER SCRIPT FILE (STABLE VERSION)
// ===============================================

const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';
let allMenuItems = [];

// ===============================================
//           CORE INITIALIZER
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeSharedComponents();
    
    if (document.querySelector('.menu-grid')) {
        displayMenuItems();
    }

    if (document.getElementById('track-order-btn')) {
        initializeOrderStatusPage();
    }
});

// ===============================================
//           MENU PAGE
// ===============================================

async function displayMenuItems() {
    const container = document.querySelector('.menu-grid');
    container.innerHTML = '<p class="loading-message">กำลังโหลด...</p>';

    const res = await fetch(`${API_BASE_URL}/api/items/`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    allMenuItems = data;

    container.innerHTML = '';

    data.forEach(item => {
        const imageSrc = item.image_url
            ? item.image_url
            : 'https://via.placeholder.com/150?text=No+Image';

        container.insertAdjacentHTML('beforeend', `
            <div class="menu-card">
                <img src="${imageSrc}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>${item.price} บาท</p>
                <button
                    class="checkout-btn add-to-cart-btn"
                    onclick="addToCart(${item.id})">
                    เพิ่มลงตะกร้า
                </button>
            </div>
        `);
    });
}
// ===============================================
//           SHARED
// ===============================================

function initializeSharedComponents() {
    initializeCartModal();
    initializeCheckoutModal();
    renderCart();
    initializeGlobalEventListeners();
}

// ===============================================
//           CART
// ===============================================

function addToCart(id) {
    const product = allMenuItems.find(p => p.id == id);
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];

    const existing = cart.find(i => i.id == id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name: product.name, price: product.price, quantity: 1 });
    }

    localStorage.setItem('kitsuCart', JSON.stringify(cart));
    renderCart();
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    cart = cart.filter(i => i.id != id);
    localStorage.setItem('kitsuCart', JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];

    const container = document.getElementById('modal-cart-items');
    const totalEl = document.getElementById('modal-cart-total');
    const fab = document.getElementById('cart-fab');
    const badges = document.querySelectorAll('.cart-badge'); // ⭐ สำคัญ

    if (!container || !totalEl) return;

    container.innerHTML = '';

    let total = 0;
    let qty = 0;

if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart">ยังไม่มีสินค้าในตะกร้า</p>`;
    totalEl.textContent = '0.00';

    // ซ่อน badge + FAB
    badges.forEach(badge => badge.classList.add('hidden'));
    fab?.classList.add('hidden');

    return; // ✅ สำคัญมาก
}



    cart.forEach(item => {
        total += item.price * item.quantity;
        qty += item.quantity;

        container.insertAdjacentHTML('beforeend', `
            <div class="cart-item">
                <span class="item-name">${item.name}</span>

                <div class="cart-controls">
                    <button data-action="decrease" data-id="${item.id}">-</button>
                    <span class="item-qty">${item.quantity}</span>
                    <button data-action="increase" data-id="${item.id}">+</button>
                    <button data-action="remove" data-id="${item.id}">x</button>
                </div>
            </div>
        `);
    });

    totalEl.textContent = total.toFixed(2);

    // ✅ อัปเดต badge ทุกตัว (desktop + mobile)
    badges.forEach(badge => {
        badge.textContent = qty;
        badge.classList.toggle('hidden', qty === 0);
    });

    // ✅ FAB
    fab?.classList.toggle('hidden', qty === 0);
}

function decreaseQuantity(id) {
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];

    const item = cart.find(i => i.id == id);
    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id != id);
    }

    localStorage.setItem('kitsuCart', JSON.stringify(cart));
    renderCart();
}


// ===============================================
//           MODALS
// ===============================================

function initializeCartModal() {
    const icon = document.getElementById('cart-icon');
    const fab = document.getElementById('cart-fab');
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-modal-overlay');
    const close = document.getElementById('modal-close-btn');

    const open = () => {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    };

    const closeFn = () => {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    };

    icon?.addEventListener('click', open);
    fab?.addEventListener('click', open);
    close?.addEventListener('click', closeFn);
    overlay?.addEventListener('click', closeFn);
}

function initializeCheckoutModal() {
    const checkoutBtn = document.querySelector('#cart-modal .checkout-btn');
    const modal = document.getElementById('checkout-modal');
    const overlay = document.getElementById('checkout-modal-overlay');
    const close = document.getElementById('checkout-close-btn');
    const form = document.getElementById('checkout-form');

    const open = () => {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    };

    const closeFn = () => {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    };

    checkoutBtn?.addEventListener('click', () => {
        const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
        if (cart.length === 0) {
            alert('ตะกร้าว่าง');
            return;
        }
        open();
    });

    close?.addEventListener('click', closeFn);
    overlay?.addEventListener('click', closeFn);
    form?.addEventListener('submit', handleOrderSubmit);
}

// ===============================================
//           CHECKOUT → PAYMENT SIMULATOR
// ===============================================
async function handleOrderSubmit(e) {
  e.preventDefault();

  const rawCart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
  if (rawCart.length === 0) {
    alert('ตะกร้าว่าง');
    return;
  }

  // แปลงให้ backend รับได้
  const items = rawCart.map(i => ({
    id: Number(i.id),
    quantity: Number(i.quantity)
  }));

  try {
    // STEP 1: สร้าง Order
    const orderRes = await fetch(`${API_BASE_URL}/api/orders/submit-final/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: document.getElementById('customer_name')?.value ?? '',
        customer_phone: document.getElementById('customer_phone')?.value ?? '',
        customer_address: document.getElementById('customer_address')?.value ?? '',
        items: JSON.stringify(items) // backend บังคับ string
      })
    });

    const raw = await orderRes.text();
    if (!orderRes.ok) {
      console.error('BACKEND RESPONSE:', raw);
      throw new Error('Create order failed');
    }

    // ✅ รับข้อมูลให้ครบ
    const orderData = JSON.parse(raw);
    const { order_id, total_price } = orderData;

    // STEP 2: สร้าง Payment Intent
    const payRes = await fetch(`${API_BASE_URL}/api/payment/create-intent/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id,
        amount: total_price
      })
    });

    if (!payRes.ok) throw new Error('Payment failed');

    const payData = await payRes.json();

    // STEP 3: Redirect
    window.location.href = payData.simulator_url;

  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาด');
  }
}


// ===============================================
//           GLOBAL EVENTS
// ===============================================

function initializeGlobalEventListeners() {
    document.addEventListener('click', e => {

        const add = e.target.closest('.add-to-cart-btn');
        if (add) {
            addToCart(add.dataset.id);

            const t = add.textContent;
            add.textContent = 'เพิ่มแล้ว ✓';
            add.disabled = true;

            setTimeout(() => {
                add.textContent = t;
                add.disabled = false;
            }, 800);
        }
    });
}

// ===============================================
//           MOBILE MENU
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger-menu');
  const menu = document.querySelector('.slide-menu');
  const body = document.body;

  if (!hamburger || !menu) return;

  hamburger.addEventListener('click', () => {
    menu.classList.toggle('active');

    // ปรับไอคอน Hamburger เป็นปุ่มปิด (X) เมื่อเมนูเปิดอยู่
    if (menu.classList.contains('active')) {
      hamburger.innerHTML = '&times;'; // ใช้สัญลักษณ์ X
    } else {
      hamburger.innerHTML = '&#9776;'; // ใช้สัญลักษณ์ Hamburger
    }
  });

    menu.addEventListener('click', (e) => {
    if (e.target === menu) {
      menu.classList.remove('active');
      hamburger.innerHTML = '&#9776;'; // กลับเป็นไอคอน Hamburger
    }

    menu.querySelector('ul').addEventListener('click', () => {
        menu.classList.remove('active');
        hamburger.innerHTML = '&#9776;'; // กลับเป็นไอคอน Hamburger
    });
  });
});
// ===============================================

// ===============================================
//           Event Delegation for Menu Page
// ===============================================
document
  .getElementById('modal-cart-items')
  ?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const { action, id } = btn.dataset;
    if (!action || !id) return;

    if (action === 'increase') addToCart(id);
    if (action === 'decrease') decreaseQuantity(id);
    if (action === 'remove') removeFromCart(id);
});
// ===============================================

