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
                ${item.description ? `<p class="menu-description">${item.description}</p>` : ''}
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
            alert('สร้างคำสั่งซื้อไม่สำเร็จ');
            return;
        }

        const orderData = JSON.parse(raw);

        // 🔥 เรียก Payment Intent API ต่อ
        const paymentRes = await fetch(`${API_BASE_URL}/api/payment/create-intent/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderData.order_id
            })
        });

        const paymentData = await paymentRes.json();

        if (!paymentRes.ok) {
            alert('สร้าง payment intent ไม่สำเร็จ');
            return;
        }

        // ✅ redirect ไป URL ที่ backend ส่งมา
        window.location.href = paymentData.simulator_url;

    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด');
    }
});

// ===============================================
//           ORDER TRACKING
// ===============================================

// Map status จาก backend → step
const STATUS_STEP_MAP = {
    'AWAITING_PAYMENT': 1,
    'PENDING':          1,
    'PREPARING':        2,
    'DELIVERING':       3,
    'COMPLETED':        4,
    'CANCELLED':        -1,
};

const STATUS_LABEL_MAP = {
    'AWAITING_PAYMENT': 'รอชำระเงิน',
    'PENDING':          'รอดำเนินการ',
    'PREPARING':        'กำลังเตรียมอาหาร',
    'DELIVERING':       'กำลังจัดส่ง',
    'COMPLETED':        'จัดส่งสำเร็จ',
    'CANCELLED':        'ยกเลิกแล้ว',
};

const STATUS_COLOR_MAP = {
    'AWAITING_PAYMENT': '#e67e22',
    'PENDING':          '#e67e22',
    'PREPARING':        '#2980b9',
    'DELIVERING':       '#8e44ad',
    'COMPLETED':        '#27ae60',
    'CANCELLED':        '#e74c3c',
};

function updateProgressBar(orderStatus) {
    const steps = ['unpaid', 'preparing', 'delivering', 'completed'];
    const lines = ['line-1', 'line-2', 'line-3'];
    const currentStep = STATUS_STEP_MAP[orderStatus] ?? 1;

    // Reset ทุก step ก่อน
    steps.forEach(s => {
        const el = document.getElementById(`step-${s}`);
        el?.classList.remove('active', 'completed', 'cancelled');
        const circle = el?.querySelector('.step-circle');
        if (circle) circle.textContent = steps.indexOf(s) + 1;
    });
    lines.forEach(l => {
        document.getElementById(l)?.classList.remove('completed');
    });

    if (orderStatus === 'CANCELLED') {
        document.getElementById('step-unpaid')?.classList.add('cancelled');
        return;
    }

    // ทำ step ที่ผ่านมาแล้วเป็น completed
    steps.forEach((s, index) => {
        const stepNum = index + 1;
        const el = document.getElementById(`step-${s}`);
        if (stepNum < currentStep) {
            el?.classList.add('completed');
            const circle = el?.querySelector('.step-circle');
            if (circle) circle.textContent = '';
        } else if (stepNum === currentStep) {
            el?.classList.add('active');
        }
    });

    // ทำ line ที่ผ่านมาแล้วเป็น completed
    lines.forEach((l, index) => {
        if (index + 1 < currentStep) {
            document.getElementById(l)?.classList.add('completed');
        }
    });
}

document.getElementById('track-order-btn')?.addEventListener('click', async () => {
    const orderId = document.getElementById('order-id-input')?.value.trim();

    if (!orderId) {
        alert('กรุณากรอก Order ID');
        return;
    }

    const btn = document.getElementById('track-order-btn');
    btn.textContent = 'กำลังค้นหา...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/`);

        if (!res.ok) {
            alert('ไม่พบ Order นี้ กรุณาตรวจสอบ Order ID อีกครั้ง');
            return;
        }

        const data = await res.json();

        // แสดง container
        const container = document.getElementById('status-display-container');
        container.style.display = 'block';

        // อัปเดต UI
        document.getElementById('display-order-id').textContent = data.id;
        document.getElementById('display-total-price').textContent = parseFloat(data.total_price).toFixed(2);

        // Status badge
        const statusEl = document.getElementById('order-status');
        statusEl.textContent = STATUS_LABEL_MAP[data.status] ?? data.status;
        statusEl.style.background = STATUS_COLOR_MAP[data.status] ?? '#999';
        statusEl.style.color = 'white';

        // Progress bar
        updateProgressBar(data.status);

    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
        btn.textContent = 'ติดตาม';
        btn.disabled = false;
    }
});