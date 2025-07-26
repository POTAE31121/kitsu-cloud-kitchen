// ===============================================
//           ไฟล์ scripts.js ฉบับสมบูรณ์ (Final)
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // --- ส่วนที่ 1: โค้ดสำหรับจัดการเมนูสไลด์ ---
    const toggle = document.getElementById('menu-toggle');
    const slideMenu = document.getElementById('slide-menu');
    if (toggle && slideMenu) {
        toggle.addEventListener('click', () => { slideMenu.classList.toggle('active'); });
        document.querySelectorAll('#slide-menu a').forEach(link => { link.addEventListener('click', () => { slideMenu.classList.remove('active'); }); });
        slideMenu.addEventListener('click', (e) => { if (e.target === slideMenu) { slideMenu.classList.remove('active'); } });
    }

    // --- ส่วนที่ 2: เรียกใช้ฟังก์ชันหลัก ---
    displayMenuItems();
    renderCart();
    initializeCartModal();
    initializeCheckoutModal();
});

let allMenuItems = []; // ตัวแปรสำหรับเก็บข้อมูลเมนูทั้งหมด

async function displayMenuItems() {
    const apiUrl = 'https://kitsu-django-backend.onrender.com/api/items/';
    const menuContainer = document.querySelector('.menu-grid');
    if (!menuContainer) { return; }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const menuItems = await response.json();
        allMenuItems = menuItems; 

        menuContainer.innerHTML = '';
        menuItems.forEach(item => {
            const menuCardHTML = `
                <div class="menu-card">
                    <img src="${item.image_url}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p class="price">฿${parseInt(item.price)}</p>
                    <button class="add-to-cart-btn" data-id="${item.id}">เพิ่มลงตะกร้า</button>
                </div>
            `;
            menuContainer.insertAdjacentHTML('beforeend', menuCardHTML);
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเมนู:', error);
        menuContainer.innerHTML = '<p style="color: red; text-align: center;">ขออภัย, ไม่สามารถโหลดรายการเมนูได้ในขณะนี้</p>';
    }
}

// ... (โค้ดส่วน Shopping Cart Logic ทั้งหมด) ...

function addToCart(productId) {
    const productToAdd = allMenuItems.find(item => item.id == productId);
    if (!productToAdd) { return; }
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const existingItem = cart.find(item => item.id == productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productToAdd.id, name: productToAdd.name, price: productToAdd.price, quantity: 1 });
    }
    localStorage.setItem('kitsuCart', JSON.stringify(cart));
    renderCart();
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const updatedCart = cart.filter(item => item.id != productId);
    localStorage.setItem('kitsuCart', JSON.stringify(updatedCart));
    renderCart();
}

function renderCart() {
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const modalCartContainer = document.getElementById('modal-cart-items');
    const modalCartTotalEl = document.getElementById('modal-cart-total');
    const cartBadge = document.getElementById('cart-badge');
    const cartBadgeFab = document.getElementById('cart-badge-fab');
    const cartFab = document.getElementById('cart-fab');
    if (!modalCartContainer) return;
    modalCartContainer.innerHTML = '';
    let total = 0;
    let totalItems = 0;
    if (cart.length === 0) {
        modalCartContainer.innerHTML = '<p style="text-align: center;">ตะกร้าของคุณว่างเปล่า</p>';
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-details">
                    <span>${item.name} (x${item.quantity})</span>
                    <span class="cart-item-price">฿${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
                <button class="remove-from-cart-btn" data-id="${item.id}">×</button>
            `;
            modalCartContainer.appendChild(itemElement);
            total += parseFloat(item.price) * item.quantity;
            totalItems += item.quantity;
        });
    }
    modalCartTotalEl.textContent = total.toFixed(2);
    cartBadge.textContent = totalItems;
    cartBadgeFab.textContent = totalItems;
    if (totalItems > 0) {
        cartBadge.classList.remove('hidden');
        cartBadgeFab.classList.remove('hidden');
        if (cartFab) cartFab.classList.remove('hidden');
    } else {
        cartBadge.classList.add('hidden');
        cartBadgeFab.classList.add('hidden');
        if (cartFab) cartFab.classList.add('hidden');
    }
}

function initializeCartModal() {
    const cartIcon = document.getElementById('cart-icon');
    const cartFab = document.getElementById('cart-fab');
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');
    function openModal() { modal.classList.remove('hidden'); overlay.classList.remove('hidden'); }
    function closeModal() { modal.classList.add('hidden'); overlay.classList.add('hidden'); }
    if(cartIcon && cartFab && modal && overlay && closeBtn) {
        cartIcon.addEventListener('click', openModal);
        cartFab.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
    }
}

function initializeCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutOverlay = document.getElementById('checkout-modal-overlay');
    const checkoutCloseBtn = document.getElementById('checkout-close-btn');
    const checkoutForm = document.getElementById('checkout-form');
    function openCheckoutModal() {
        document.getElementById('cart-modal').classList.add('hidden');
        document.getElementById('cart-modal-overlay').classList.add('hidden');
        checkoutModal.classList.remove('hidden');
        checkoutOverlay.classList.remove('hidden');
    }
    function closeCheckoutModal() { checkoutModal.classList.add('hidden'); checkoutOverlay.classList.add('hidden'); }
    if(checkoutModal && checkoutOverlay && checkoutCloseBtn && checkoutForm) {
        checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
        checkoutOverlay.addEventListener('click', closeCheckoutModal);
        checkoutForm.addEventListener('submit', handleOrderSubmit);
    }
    const openCheckoutBtn = document.querySelector('#cart-modal .checkout-btn');
    if (openCheckoutBtn) {
        openCheckoutBtn.addEventListener('click', function() {
            let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
            if (cart.length > 0) { openCheckoutModal(); } else { alert('กรุณาเลือกสินค้าลงตะกร้าก่อนนะครับ'); }
        });
    }
}

async function handleOrderSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('confirm-order-btn');
    submitBtn.textContent = 'กำลังส่ง...';
    submitBtn.disabled = true;
    const customer_name = document.getElementById('customer_name').value;
    const customer_phone = document.getElementById('customer_phone').value;
    const customer_address = document.getElementById('customer_address').value;
    const cartItems = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const orderData = {
        customer_name, customer_phone, customer_address,
        items: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
    };
    try {
        const response = await fetch('https://kitsu-django-backend.onrender.com/api/orders/create/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });
        if (response.ok) {
            localStorage.removeItem('kitsuCart');
            renderCart();
            document.getElementById('checkout-modal').classList.add('hidden');
            document.getElementById('checkout-modal-overlay').classList.add('hidden');
            alert('ขอบคุณสำหรับคำสั่งซื้อ! ออเดอร์ของคุณถูกส่งเรียบร้อยแล้ว');
        } else {
            const errorData = await response.json();
            alert('เกิดข้อผิดพลาด: ' + JSON.stringify(errorData));
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
        submitBtn.textContent = 'ยืนยันคำสั่งซื้อ';
        submitBtn.disabled = false;
    }
}

document.addEventListener('click', function(event) {
    const addButton = event.target.closest('.add-to-cart-btn');
    if (addButton) {
        const productId = addButton.getAttribute('data-id');
        addToCart(productId);
        addButton.textContent = 'เพิ่มแล้ว!';
        addButton.style.background = '#27ae60';
        setTimeout(() => { addButton.textContent = 'เพิ่มลงตะกร้า'; addButton.style.background = ''; }, 1000);
        return;
    }
    const removeButton = event.target.closest('.remove-from-cart-btn');
    if (removeButton) {
        const productId = removeButton.getAttribute('data-id');
        removeFromCart(productId);
        return;
    }
});