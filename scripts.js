// ===============================================
//           MASTER SCRIPT FILE (Final Version)
// ===============================================

// ตัวแปรที่ใช้ร่วมกันในทุกหน้า
let allMenuItems = [];
const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';

// ===============================================
//           CORE INITIALIZER
// ===============================================

// ฟังก์ชันนี้จะทำงานเป็นอันดับแรกสุดเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    console.log("Kitsu Kitchen master script loaded!");

     // --- ⭐️ 1. ตรวจสอบ "สถานะรอชำระเงิน" ก่อนเป็นอันดับแรก! ⭐️ ---
    const pendingOrderJSON = localStorage.getItem('pendingPaymentOrder');
    if (pendingOrderJSON) {
        const pendingOrder = JSON.parse(pendingOrderJSON);
        console.log("Pending payment found for order:", pendingOrder.id);
        // ถ้ามีออเดอร์รอจ่ายเงิน ให้เปิดหน้าต่างชำระเงินขึ้นมาทันที
        openPaymentModal(pendingOrder.id, pendingOrder.total);
    }

    // --- 2. เปิดใช้งานส่วนประกอบที่ 'มีอยู่ทุกหน้า' ---
    initializeSharedComponents();

    // --- 3. ตรวจสอบว่าเราอยู่หน้าไหน แล้วค่อยเรียกใช้ฟังก์ชันเฉพาะทาง ---
    // นี่คือหัวใจของการแก้ไขบั๊กทั้งหมด
    if (document.querySelector('.menu-grid')) {
        console.log("Main page detected. Loading menu items...");
        displayMenuItems();
    }

    if (document.getElementById('track-order-btn')) {
        console.log("Order status page detected. Initializing tracker...");
        initializeOrderStatusPage();
    }
});


// ===============================================
//           PAGE-SPECIFIC LOGIC
// ===============================================

// --- Logic สำหรับหน้าหลัก (index.html) เท่านั้น ---
async function displayMenuItems() {
    const apiUrl = `${API_BASE_URL}/api/items/`;
    const menuContainer = document.querySelector('.menu-grid');
    if (!menuContainer) { return; }

    menuContainer.innerHTML = '<p class="loading-text">กำลังโหลดเมนูสักครู่นะครับ...</p>';
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const menuItems = await response.json();
        allMenuItems = menuItems;

        if (menuItems.length > 0) {
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
        } else {
            menuContainer.innerHTML = '<p class="loading-text">ไม่มีเมนูในขณะนี้</p>';
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเมนู:', error);
        menuContainer.innerHTML = '<p style="color: red; text-align: center;">ขออภัย, ไม่สามารถโหลดรายการเมนูได้ในขณะนี้</p>';
    }
}

// --- Logic สำหรับหน้าติดตามออเดอร์ (order-status.html) เท่านั้น ---
function initializeOrderStatusPage() {
    const trackOrderBtn = document.getElementById('track-order-btn');
    const orderIdInput = document.getElementById('order-id-input');
    const statusDisplayContainer = document.getElementById('status-display-container');

    trackOrderBtn.addEventListener('click', async () => {
        const orderId = orderIdInput.value.trim();
        if (!orderId) {
            alert('กรุณากรอก Order ID');
            return;
        }
        const apiUrl = `https://kitsu-django-backend.onrender.com/api/orders/${orderId}/`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('ไม่พบออเดอร์นี้ หรือข้อมูลอาจจะยังไม่ถูกอัปเดต');
            }
            const data = await response.json();
            
            document.getElementById('order-status').textContent = data.status;
            document.getElementById('display-order-id').textContent = data.id;
            document.getElementById('display-total-price').textContent = parseFloat(data.total_price).toFixed(2);
            statusDisplayContainer.style.display = 'block';

        } catch (error) {
            alert(error.message);
            statusDisplayContainer.style.display = 'none';
        }
    });
}


// ===============================================
//           SHARED LOGIC (ใช้ได้ทุกหน้า)
// ===============================================

function initializeSharedComponents() {
    initializeSlideMenu();
    initializeCartModal();
    initializeCheckoutModal();
    initializePaymentModal();
    renderCart();
    initializeGlobalEventListeners();
}

function initializeSlideMenu() {
    const toggle = document.getElementById('menu-toggle');
    const slideMenu = document.getElementById('slide-menu');
    if (toggle && slideMenu) {
        toggle.addEventListener('click', () => { slideMenu.classList.toggle('active'); });
        document.querySelectorAll('#slide-menu a').forEach(link => { link.addEventListener('click', () => { slideMenu.classList.remove('active'); }); });
        slideMenu.addEventListener('click', (e) => { if (e.target === slideMenu) { slideMenu.classList.remove('active'); } });
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

// --- ⭐️ ฟังก์ชัน initializePaymentModal ฉบับอัปเกรด ⭐️ ---
function initializePaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    const paymentOverlay = document.getElementById('payment-modal-overlay');
    const closeBtn = document.getElementById('payment-modal-close-btn');
    const slipForm = document.getElementById('slip-upload-form');

    function closePaymentModal() {
        if(paymentModal && paymentOverlay) {
            paymentModal.classList.add('hidden');
            paymentOverlay.classList.add('hidden');
        }
    }

    if (slipForm) {
        slipForm.addEventListener('submit', handleSlipSubmit);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closePaymentModal);
    }
    if (paymentOverlay) {
        paymentOverlay.addEventListener('click', closePaymentModal);
    }
}


// --- ⭐️ ฟังก์ชัน openPaymentModal ฉบับ "อัปเกรด" ⭐️ ---
function openPaymentModal(orderInfo) {
    const paymentModal = document.getElementById('payment-modal');
    const paymentOverlay = document.getElementById('payment-modal-overlay');
    if (!paymentModal || !paymentOverlay) return;

    // แสดงยอดชำระ
    document.getElementById('payment-total').textContent = orderInfo.total.toFixed(2);
    
    // ⭐️ "ฝัง" ข้อมูลทั้งหมดไว้ใน Form เพื่อใช้ตอน Submit ⭐️
    const slipForm = document.getElementById('slip-upload-form');
    slipForm.dataset.customerName = orderInfo.customer_name;
    slipForm.dataset.customerPhone = orderInfo.customer_phone;
    slipForm.dataset.customerAddress = orderInfo.customer_address;
    slipForm.dataset.cartItems = JSON.stringify(orderInfo.cartItems);
    
    paymentModal.classList.remove('hidden');
    paymentOverlay.classList.remove('hidden');
}


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
    if(modalCartTotalEl) modalCartTotalEl.textContent = total.toFixed(2);
    if(cartBadge) cartBadge.textContent = totalItems;
    if(cartBadgeFab) cartBadgeFab.textContent = totalItems;
    
    if (totalItems > 0) {
        if(cartBadge) cartBadge.classList.remove('hidden');
        if(cartBadgeFab) cartBadgeFab.classList.remove('hidden');
        if (cartFab) cartFab.classList.remove('hidden');
    } else {
        if(cartBadge) cartBadge.classList.add('hidden');
        if(cartBadgeFab) cartBadgeFab.classList.add('hidden');
        if (cartFab) cartFab.classList.add('hidden');
    }
}

// --- ⭐️ ฟังก์ชัน handleOrderSubmit ฉบับ "เปลี่ยนแปลง" ⭐️ ---
// ฟังก์ชันนี้จะ "ไม่" ส่งออเดอร์อีกต่อไป แต่จะทำหน้าที่แค่ "เปิดหน้าต่างชำระเงิน"
//async function handleOrderSubmit(event) {
    //event.preventDefault();
    
    // 1. รวบรวมข้อมูลจากฟอร์ม
    //const customer_name = document.getElementById('customer_name').value;
    //const customer_phone = document.getElementById('customer_phone').value;
    //const customer_address = document.getElementById('customer_address').value;
    //const cartItems = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    
    // คำนวณราคารวม
    //const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    // 2. ซ่อนหน้าต่าง Checkout
    //document.getElementById('checkout-modal').classList.add('hidden');
    //document.getElementById('checkout-modal-overlay').classList.add('hidden');
    
    // 3. เปิดหน้าต่าง Payment และ "ส่งข้อมูล" ไปให้
    //openPaymentModal({ customer_name, customer_phone, customer_address, cartItems, total });
//}

// --- ⭐️ ฟังก์ชัน handleSlipSubmit ฉบับ "อัปเกรดใหญ่" ⭐️ ---
// ตอนนี้ฟังก์ชันนี้จะทำหน้าที่ส่ง "ทุกอย่าง"
async function handleSlipSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const fileInput = document.getElementById('slip-file-input');
    const submitBtn = document.getElementById('confirm-payment-btn');

    if (fileInput.files.length === 0) { /* ... */ return; }

    submitBtn.textContent = 'กำลังส่งออเดอร์...';
    submitBtn.disabled = true;

    // 1. สร้าง FormData สำหรับส่งไฟล์
    const formData = new FormData();
    formData.append('payment_slip', fileInput.files[0]);
    
    // 2. "ดึง" ข้อมูลที่ฝังไว้ออกมา
    formData.append('customer_name', form.dataset.customerName);
    formData.append('customer_phone', form.dataset.customerPhone);
    formData.append('customer_address', form.dataset.customerAddress);
    formData.append('items', form.dataset.cartItems);

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/submit-final/`, {
            method: 'POST',
            body: formData, // ส่ง FormData ที่มีทุกอย่าง
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.removeItem('kitsuCart'); // ล้างตะกร้า
            renderCart();
            alert(`ออเดอร์ #${result.order_id} สำเร็จ! ขอบคุณครับ`);
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        submitBtn.textContent = 'ยืนยันการชำระเงิน';
        submitBtn.disabled = false;
    }
}


function initializeGlobalEventListeners() {
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
}

// --- ⭐️ ฟังก์ชัน handleOrderSubmit ฉบับ "เปลี่ยนแปลง" ⭐️ ---
// ฟังก์ชันนี้จะ "ไม่" สร้างออเดอร์โดยตรงอีกต่อไป
async function handleOrderSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('confirm-order-btn');
    submitBtn.textContent = 'กำลังสร้างคำสั่งซื้อ...';
    submitBtn.disabled = true;

    // รวบรวมข้อมูลเหมือนเดิม
    const customer_name = document.getElementById('customer_name').value;
    const customer_phone = document.getElementById('customer_phone').value;
    const customer_address = document.getElementById('customer_address').value;
    const cartItems = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    
    const orderData = {
        customer_name, customer_phone, customer_address,
        items: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
    };

    try {
        // ⭐️ เรียกใช้ API ใหม่เพื่อสร้าง Payment Intent ⭐️
        const response = await fetch(`${API_BASE_URL}/api/payments/create-intent/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });

        if (response.ok) {
            const result = await response.json();
            // ⭐️ "วาร์ป" ไปที่หน้า Simulator ⭐️
            window.location.href = result.simulator_url;
        } else {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ: ' + error.message);
    } finally {
        submitBtn.textContent = 'ยืนยันข้อมูล';
        submitBtn.disabled = false;
    }
}