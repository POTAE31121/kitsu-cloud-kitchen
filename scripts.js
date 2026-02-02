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
        container.insertAdjacentHTML('beforeend', `
            <div class="menu-card">
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

    if (!container || !totalEl) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p>ยังไม่มีสินค้าในตะกร้า</p>`;
        totalEl.textContent = '0.00';
        return;
    }

    cart.forEach(item => {
        total += item.price * item.quantity;

        container.insertAdjacentHTML('beforeend', `
            <div class="cart-item">
                <span>${item.name} x ${item.quantity}</span>
                <button class="remove-from-cart-btn" data-id="${item.id}">×</button>
            </div>
        `);
    });

    totalEl.textContent = total.toFixed(2);
}

// ===============================================
//           MODALS
// ===============================================

function initializeCartModal() {
    const icon = document.getElementById('cart-icon');
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
    close?.addEventListener('click', closeFn);
    overlay?.addEventListener('click', closeFn);
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