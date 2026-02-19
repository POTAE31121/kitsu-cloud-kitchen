// ===============================================
//           MASTER SCRIPT FILE (STABLE)
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
});

// ===============================================
//           MENU PAGE
// ===============================================

async function displayMenuItems() {
    const container = document.querySelector('.menu-grid');
    if (!container) return;

    container.innerHTML = 'กำลังโหลด...';

    const res = await fetch(`${API_BASE_URL}/api/items/`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    allMenuItems = data;

    container.innerHTML = '';

    data.forEach(item => {
        const imageSrc = item.image_url
            ? item.image_url
            : 'https://via.placeholder.com/300x200?text=No+Image';

        container.insertAdjacentHTML('beforeend', `
            <div class="menu-card">
                <img src="${imageSrc}" alt="${item.name}">
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
//           SHARED
// ===============================================

function initializeSharedComponents() {
    initializeCartModal();
    initializeMobileMenu();
    renderCart();
    initializeGlobalEventListeners();
}

// ===============================================
//           CART
// ===============================================

function addToCart(id) {
    const product = allMenuItems.find(p => p.id == id);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const existing = cart.find(i => i.id == id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
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

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const container = document.getElementById('modal-cart-items');
    const totalEl = document.getElementById('modal-cart-total');
    const badges = document.querySelectorAll('.cart-badge');

    // ✅ FIX เดียวตามกฎเหล็ก: กันกรณี badge ยังไม่อยู่ใน DOM
    if (!container || !totalEl || badges.length === 0) return;

    let totalQty = 0;
    let total = 0;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<p>ยังไม่มีสินค้าในตะกร้า</p>`;
        totalEl.textContent = '0.00';

        badges.forEach(b => {
            b.textContent = '0';
            b.classList.add('hidden');
        });

        return;
    }

    cart.forEach(item => {
        total += item.price * item.quantity;
        totalQty += item.quantity;

        container.insertAdjacentHTML('beforeend', `
            <div class="cart-item">
                <span class="item-name">${item.name}</span>
                <div class="cart-controls">
                    <button class="qty-btn decrease-btn" data-id="${item.id}">-</button>
                    <span class="item-qty">${item.quantity}</span>
                    <button class="qty-btn increase-btn" data-id="${item.id}">+</button>
                    <button class="remove-from-cart-btn" data-id="${item.id}">x</button>
                </div>
            </div>
        `);
    });

    totalEl.textContent = total.toFixed(2);

    badges.forEach(b => {
        b.textContent = totalQty;
        b.classList.remove('hidden');
    });
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

    const checkoutBtn = modal?.querySelector('.checkout-btn');

    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutOverlay = document.getElementById('checkout-modal-overlay');
    const checkoutClose = document.getElementById('checkout-close-btn');

    if (!modal || !overlay) return;

    const openCart = () => {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    };

    const closeCart = () => {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    };

    const openCheckout = () => {
        checkoutModal?.classList.remove('hidden');
        checkoutOverlay?.classList.remove('hidden');
    };

    const closeCheckout = () => {
        checkoutModal?.classList.add('hidden');
        checkoutOverlay?.classList.add('hidden');
    };

    icon?.addEventListener('click', openCart);
    fab?.addEventListener('click', openCart);
    close?.addEventListener('click', closeCart);
    overlay?.addEventListener('click', closeCart);

    checkoutBtn?.addEventListener('click', () => {
    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];

    if (cart.length === 0) {
        alert('ตะกร้าว่าง');
        return;
    }
        closeCart();
        openCheckout();
    });

    checkoutClose?.addEventListener('click', closeCheckout);
    checkoutOverlay?.addEventListener('click', closeCheckout);
}

// ===============================================
//           MOBILE MENU
// ===============================================

function initializeMobileMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const menu = document.querySelector('.slide-menu');

    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
        menu.classList.toggle('active');
        hamburger.innerHTML = menu.classList.contains('active')
            ? '&times;'
            : '&#9776;';
    });

    menu.querySelector('ul')?.addEventListener('click', () => {
        menu.classList.remove('active');
        hamburger.innerHTML = '&#9776;';
    });
}

// ===============================================
//           GLOBAL EVENTS (DELEGATION)
// ===============================================

function initializeGlobalEventListeners() {
    document.addEventListener('click', function (e) {

        const addBtn = e.target.closest('.add-to-cart-btn');
        const incBtn = e.target.closest('.increase-btn');
        const decBtn = e.target.closest('.decrease-btn');
        const removeBtn = e.target.closest('.remove-from-cart-btn');

        if (addBtn) {
            addToCart(addBtn.dataset.id);
            return;
        }

        if (incBtn) {
            addToCart(incBtn.dataset.id);
            return;
        }

        if (decBtn) {
            decreaseQuantity(decBtn.dataset.id);
            return;
        }

        if (removeBtn) {
            removeFromCart(removeBtn.dataset.id);
            return;
        }
    });
}

// ===============================================
//   CHECKOUT → PAYMENT SIMULATOR (FRONTEND)
// ===============================================

document.getElementById('checkout-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];

    // ❗ validate cart
    if (cart.length === 0) {
        alert('ตะกร้าว่าง');
        console.log('ตะกร้าว่าง');
        return;
    }

    // แปลง cart ให้ backend รับได้
    const items = cart.map(i => ({
        id: Number(i.id),
        quantity: Number(i.quantity)
    }));

    try {
        const res = await fetch(`${API_BASE_URL}/api/orders/submit-final/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: document.getElementById('customer_name')?.value ?? '',
                customer_phone: document.getElementById('customer_phone')?.value ?? '',
                customer_address: document.getElementById('customer_address')?.value ?? '',
                items: JSON.stringify(items) // backend บังคับ string
            })
        });

        const raw = await res.text();
        if (!res.ok) {
            console.error('BACKEND ERROR:', raw);
            alert('สร้างคำสั่งซื้อไม่สำเร็จ');
            return;
        }

        const data = JSON.parse(raw);

        // 🔑 backend ของคุณต้องส่งค่านี้กลับมา
        if (!data.simulator_url) {
            alert('ไม่พบ payment simulator');
            return;
        }

        // ✅ redirect ไป payment simulator
        window.location.href = "payment-simulator.html";

    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด');
    }
});