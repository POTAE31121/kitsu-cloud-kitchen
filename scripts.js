// ===============================================
//           CORE & MENU DISPLAY LOGIC
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
    renderCart(); // แสดงผลตะกร้าครั้งแรกเมื่อโหลด
    initializeCartModal(); // เปิดใช้งาน Modal
});

async function displayMenuItems() {
    const apiUrl = 'https://kitsu-backend.onrender.com/api/items/';
    const menuContainer = document.querySelector('.menu-grid');
    if (!menuContainer) { console.error('Error: ไม่พบ Element ที่มีคลาส .menu-grid'); return; }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const menuItems = await response.json();
        allMenuItems = menuItems; // เก็บข้อมูลเมนูไว้ใช้กับตะกร้า

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

// ===============================================
//           SHOPPING CART LOGIC (UPGRADED FOR MODAL)
// ===============================================
let allMenuItems = [];

function addToCart(productId) {
    const productToAdd = allMenuItems.find(item => item.id == productId);
    if (!productToAdd) { console.error("ไม่พบสินค้า ID:", productId); return; }
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

// --- ฟังก์ชัน renderCart ฉบับอัปเกรด ---
function renderCart() {
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    
    // UI Elements ใหม่ทั้งหมด
    const modalCartContainer = document.getElementById('modal-cart-items');
    const modalCartTotalEl = document.getElementById('modal-cart-total');
    const cartBadge = document.getElementById('cart-badge');       // Desktop
    const cartBadgeFab = document.getElementById('cart-badge-fab'); // Mobile
    const cartFab = document.getElementById('cart-fab');           // Mobile FAB

    if (!modalCartContainer) return; // ถ้าหา Modal ไม่เจอ ให้หยุด

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

    // อัปเดต UI ทั้งหมด
    modalCartTotalEl.textContent = total.toFixed(2);
    cartBadge.textContent = totalItems;
    cartBadgeFab.textContent = totalItems;
    
    // ซ่อน/แสดง Badge และปุ่มลอย
    if (totalItems > 0) {
        cartBadge.classList.remove('hidden');
        cartBadgeFab.classList.remove('hidden');
        cartFab.classList.remove('hidden'); // แสดงปุ่มลอยเมื่อมีของ
    } else {
        cartBadge.classList.add('hidden');
        cartBadgeFab.classList.add('hidden');
        cartFab.classList.add('hidden'); // ซ่อนปุ่มลอยเมื่อไม่มีของ
    }
}

// --- ฟังก์ชันใหม่สำหรับจัดการ Modal ---
function initializeCartModal() {
    const cartIcon = document.getElementById('cart-icon');
    const cartFab = document.getElementById('cart-fab');
    const modal = document.getElementById('cart-modal');
    const overlay = document.getElementById('cart-modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');

    function openModal() {
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    }
    function closeModal() {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    }

    if(cartIcon && cartFab && modal && overlay && closeBtn) {
        cartIcon.addEventListener('click', openModal);
        cartFab.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
    }
}

// --- Event Listener ฉบับสมบูรณ์ ---
document.addEventListener('click', function(event) {
    // จัดการปุ่ม "เพิ่มลงตะกร้า"
    const addButton = event.target.closest('.add-to-cart-btn');
    if (addButton) {
        const productId = addButton.getAttribute('data-id');
        addToCart(productId);
        addButton.textContent = 'เพิ่มแล้ว!';
        addButton.style.background = '#27ae60';
        setTimeout(() => {
            addButton.textContent = 'เพิ่มลงตะกร้า';
            addButton.style.background = '';
        }, 1000);
        return;
    }
    // จัดการปุ่ม "ลบออกจากตะกร้า"
    const removeButton = event.target.closest('.remove-from-cart-btn');
    if (removeButton) {
        const productId = removeButton.getAttribute('data-id');
        removeFromCart(productId);
        return;
    }
    // จัดการปุ่ม "สั่งซื้อและชำระเงิน"
    const checkoutButton = event.target.closest('.checkout-btn');
    if (checkoutButton) {
        let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
        if (cart.length > 0) {
            alert('ขอบคุณสำหรับความสนใจ! ระบบชำระเงินกำลังจะเปิดให้บริการเร็วๆ นี้ครับ');
        } else {
            alert('กรุณาเลือกสินค้าลงตะกร้าก่อนนะครับ');
        }
    }
});