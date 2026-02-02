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
    initializeMobileMenu(); // ✅ เพิ่มเฉพาะนี้
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

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const container = document.getElementById('modal-cart-items');
    const totalEl = document.getElementById('modal-cart-total');

    // 🔹 เพิ่ม 2 บรรทัดนี้
    const badges = document.querySelectorAll('.cart-badge');
    let totalQty = 0;

    if (!container || !totalEl) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p>ยังไม่มีสินค้าในตะกร้า</p>`;
        totalEl.textContent = '0.00'

        // 🔹 ซ่อน badge เมื่อไม่มีสินค้า
        badges.forEach(b => {
            b.textContent = '0';
            b.classList.add('hidden');
        });

        return;
    }

    cart.forEach(item => {
        total += item.price * item.quantity;
        totalQty += item.quantity; // 🔹 นับจำนวนสินค้า

        container.insertAdjacentHTML('beforeend', `
            <div class="cart-item">
                <span>${item.name} x ${item.quantity}</span>
                <button class="remove-from-cart-btn" data-id="${item.id}">×</button>
            </div>
        `);
    });

    totalEl.textContent = total.toFixed(2);
    // 🔹 อัปเดต badge ทุกจุด (desktop + mobile)
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
    const fab = document.getElementById('cart-fab'); // ✅ เพิ่ม
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-modal-overlay');
    const close = document.getElementById('modal-close-btn');

    if (!modal || !overlay) return;

    const open = () => {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    };

    const closeFn = () => {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    };

    icon?.addEventListener('click', open);
    fab?.addEventListener('click', open);  // ✅ mobile
    close?.addEventListener('click', closeFn);
    overlay?.addEventListener('click', closeFn);
}

// ===============================================
//           MOBILE MENU (FIXED)
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
    document.addEventListener('click', e => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            addToCart(addBtn.dataset.id);
        }

        const removeBtn = e.target.closest('.remove-from-cart-btn');
        if (removeBtn) {
            removeFromCart(removeBtn.dataset.id);
        }
    });
}