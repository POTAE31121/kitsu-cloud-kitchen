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
    initializeMobileMenu();

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
    container.innerHTML = 'กำลังโหลด...';

    const res = await fetch(`${API_BASE_URL}/api/items/`);
    const data = await res.json();
    allMenuItems = data;

    container.innerHTML = '';
    data.forEach(item => {
        container.insertAdjacentHTML('beforeend', `
            <div class="menu-card">
                <img src="${item.image_url}">
                <h3>${item.name}</h3>
                <p>฿${item.price}</p>
                <button class="add-to-cart-btn" data-id="${item.id}">
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

    cart.forEach(item => {
        total += item.price * item.quantity;
        qty += item.quantity;

        container.insertAdjacentHTML('beforeend', `
            <div class="cart-item">
                <span>${item.name} x${item.quantity}</span>
                <button class="remove-from-cart-btn" data-id="${item.id}">×</button>
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

        const remove = e.target.closest('.remove-from-cart-btn');
        if (remove) {
            removeFromCart(remove.dataset.id);
        }
    });
}

// ===============================================
//           Initialize Mobile Menu
// ===============================================
function initializeMobileMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const slideMenu = document.getElementById('slide-menu');
    const overlay = document.getElementById('slide-menu-overlay');
    
    burger.addEventListener('click', () => {
        menu.classList.add('open');
        overlay.classList.remove('hidden');
    });

    overlay.addEventListener('click', closeMenu);

    function closeMenu() {
        menu.classList.remove('open');
        overlay.classList.add('hidden');
    }
}