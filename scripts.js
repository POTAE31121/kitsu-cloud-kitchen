// ===============================================
//           MASTER SCRIPT FILE (Final Version)
// ===============================================

// ตัวแปรที่ใช้ร่วมกันในทุกหน้า
let allMenuItems = [];

// ===============================================
//           EVENT LISTENERS & INITIALIZERS
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. เปิดใช้งานเมนูสไลด์ (ทำงานทุกหน้า) ---
    initializeSlideMenu();

    // --- 2. เปิดใช้งาน Modal ตะกร้า (ทำงานทุกหน้า) ---
    initializeCartModal();
    
    // --- 3. แสดงผลตะกร้าครั้งแรก (ทำงานทุกหน้า) ---
    renderCart();

    // --- 4. ตรวจสอบว่าหน้านี้คือ "หน้าหลัก" หรือไม่ ---
    const menuContainer = document.querySelector('.menu-grid');
    if (menuContainer) {
        displayMenuItems(); // ถ้าใช่, ให้โหลดเมนู
    }

    // --- 5. ตรวจสอบว่าหน้านี้คือ "หน้าติดตามออเดอร์" หรือไม่ ---
    const trackOrderBtn = document.getElementById('track-order-btn');
    if (trackOrderBtn) {
        initializeOrderStatusPage(); // ถ้าใช่, ให้เปิดใช้งานฟังก์ชันติดตาม
    }
});


// ===============================================
//           PAGE-SPECIFIC LOGIC
// ===============================================

// --- Logic สำหรับหน้าหลัก (index.html) ---
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

// --- Logic สำหรับหน้าติดตามออเดอร์ (order-status.html) ---
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

// --- ฟังก์ชันจัดการเมนูสไลด์ ---
function initializeSlideMenu() {
    const toggle = document.getElementById('menu-toggle');
    const slideMenu = document.getElementById('slide-menu');
    if (toggle && slideMenu) {
        toggle.addEventListener('click', () => { slideMenu.classList.toggle('active'); });
        document.querySelectorAll('#slide-menu a').forEach(link => { link.addEventListener('click', () => { slideMenu.classList.remove('active'); }); });
        slideMenu.addEventListener('click', (e) => { if (e.target === slideMenu) { slideMenu.classList.remove('active'); } });
    }
}

// --- ฟังก์ชันจัดการ Modal ตะกร้า ---
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

// --- ฟังก์ชันจัดการตะกร้าสินค้า (Add, Remove, Render) ---
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
    // ... (โค้ด renderCart เดิมของคุณสมบูรณ์แบบแล้ว ไม่ต้องแก้ไข) ...
}

// --- ฟังก์ชันจัดการ Checkout Modal ---
function initializeCheckoutModal() {
    // ... (โค้ด initializeCheckoutModal เดิมของคุณสมบูรณ์แบบแล้ว ไม่ต้องแก้ไข) ...
}

async function handleOrderSubmit(event) {
    // ... (โค้ด handleOrderSubmit เดิมของคุณสมบูรณ์แบบแล้ว ไม่ต้องแก้ไข) ...
}


// --- Event Listener กลาง (จัดการปุ่ม Add, Remove, Checkout) ---
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