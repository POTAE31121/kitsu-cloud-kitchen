// ===============================================
//           MASTER SCRIPT FILE (FINAL FIXED)
// ===============================================

let allMenuItems = [];
const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';

// ===============================================
//           CORE INITIALIZER
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Kitsu Kitchen master script loaded!");
    initializeSharedComponents();

    if (document.querySelector('.menu-grid')) {
        displayMenuItems();
    }

    if (document.getElementById('track-order-btn')) {
        initializeOrderStatusPage();
    }
});

// ===============================================
//           PAGE-SPECIFIC LOGIC
// ===============================================
async function displayMenuItems() {
    const apiUrl = `${API_BASE_URL}/api/items/`;
    const menuContainer = document.querySelector('.menu-grid');
    if (!menuContainer) return;

    menuContainer.innerHTML = 'Loading...';

    try {
        const response = await fetch(apiUrl);
        const menuItems = await response.json();
        allMenuItems = menuItems;
        menuContainer.innerHTML = '';

        menuItems.forEach(item => {
            menuContainer.insertAdjacentHTML('beforeend', `
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
    } catch {
        menuContainer.innerHTML = 'โหลดเมนูไม่สำเร็จ';
    }
}

function initializeOrderStatusPage() {
    const btn = document.getElementById('track-order-btn');
    btn.addEventListener('click', async () => {
        const id = document.getElementById('order-id-input').value.trim();
        if (!id) return alert('กรุณากรอก Order ID');

        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${id}/`);
            if (!res.ok) throw new Error();
            const data = await res.json();

            document.getElementById('order-status').textContent = data.status;
            document.getElementById('display-order-id').textContent = data.id;
            document.getElementById('display-total-price').textContent = data.total_price;
            document.getElementById('status-display-container').style.display = 'block';
        } catch {
            alert('ไม่พบออเดอร์');
        }
    });
}

// ===============================================
//           SHARED LOGIC
// ===============================================
function initializeSharedComponents() {
    initializeCartModal();
    initializeCheckoutModal();
    renderCart();
    initializeGlobalEventListeners();
}

function initializeCartModal() {
    const openBtns = [document.getElementById('cart-icon'), document.getElementById('cart-fab')];
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');

    const open = () => { modal.classList.remove('hidden'); overlay.classList.remove('hidden'); };
    const close = () => { modal.classList.add('hidden'); overlay.classList.add('hidden'); };

    openBtns.forEach(b => b && b.addEventListener('click', open));
    closeBtn && closeBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', close);
}

function initializeCheckoutModal() {
    const form = document.getElementById('checkout-form');
    if (form) form.addEventListener('submit', handleOrderSubmit);
}

// ===============================================
//           CART
// ===============================================
function addToCart(id) {
    const product = allMenuItems.find(i => i.id == id);
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const exist = cart.find(i => i.id == id);

    exist ? exist.quantity++ : cart.push({ ...product, quantity: 1 });
    localStorage.setItem('kitsuCart', JSON.stringify(cart));
    renderCart();
}

function removeFromCart(id) {
    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    localStorage.setItem('kitsuCart', JSON.stringify(cart.filter(i => i.id != id)));
    renderCart();
}

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const container = document.getElementById('modal-cart-items');
    const totalEl = document.getElementById('modal-cart-total');
    if (!container) return;

    let total = 0;
    container.innerHTML = '';

    cart.forEach(i => {
        total += i.price * i.quantity;
        container.insertAdjacentHTML('beforeend', `
            <div>
                ${i.name} x${i.quantity}
                <button class="remove-from-cart-btn" data-id="${i.id}">×</button>
            </div>
        `);
    });

    totalEl.textContent = total.toFixed(2);
}

// ===============================================
//           CHECKOUT → PAYMENT INTENT
// ===============================================
async function handleOrderSubmit(event) {
    event.preventDefault();

    const cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    if (!cart.length) return alert('ตะกร้าว่าง');

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    try {
        const res = await fetch(`${API_BASE_URL}/api/payment/create-intent/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total })
        });

        if (!res.ok) throw new Error();
        const data = await res.json();

        window.location.href = data.simulator_url;
    } catch {
        alert('สร้าง payment ไม่สำเร็จ');
    }
}

// ===============================================
//           GLOBAL EVENTS
// ===============================================
function initializeGlobalEventListeners() {
    document.addEventListener('click', e => {
        const add = e.target.closest('.add-to-cart-btn');
        if (add) addToCart(add.dataset.id);

        const remove = e.target.closest('.remove-from-cart-btn');
        if (remove) removeFromCart(remove.dataset.id);
    });
}
