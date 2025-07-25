// ===============================================
//           CORE & MENU DISPLAY LOGIC
// ===============================================

document.addEventListener('DOMContentLoaded', () => {

    // --- ส่วนที่ 1: โค้ดสำหรับจัดการเมนูสไลด์ ---
    const toggle = document.getElementById('menu-toggle');
    const slideMenu = document.getElementById('slide-menu');

    if (toggle && slideMenu) {
        toggle.addEventListener('click', () => { slideMenu.classList.toggle('active'); });
        document.querySelectorAll('#slide-menu a').forEach(link => {
            link.addEventListener('click', () => { slideMenu.classList.remove('active'); });
        });
        slideMenu.addEventListener('click', (e) => {
            if (e.target === slideMenu) { slideMenu.classList.remove('active'); }
        });
    }

    // --- ส่วนที่ 2: เรียกใช้ฟังก์ชันหลัก ---
    displayMenuItems();
    renderCart();
});


// ฟังก์ชันสำหรับดึงข้อมูลและแสดงผลเมนู
async function displayMenuItems() {
    const apiUrl = 'https://kitsu-backend.onrender.com/api/items/';
    const menuContainer = document.querySelector('.menu-grid');

    if (!menuContainer) {
        console.error('Error: ไม่พบ Element ที่มีคลาส .menu-grid');
        return;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const menuItems = await response.json();
        allMenuItems = menuItems; // เก็บข้อมูลเมนูไว้ใช้กับตะกร้า

        menuContainer.innerHTML = '';

        menuItems.forEach(item => {
            const menuCardHTML = `
                <div class="menu-card">
                    <img src="${item.image_url}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p class="price">฿${parseInt(item.price)}</p>
                    <button class="add-to-cart-btn" data-id="${item.id}">
                        เพิ่มลงตะกร้า
                    </button>
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
//           SHOPPING CART LOGIC
// ===============================================

let allMenuItems = []; // ตัวแปรสำหรับเก็บข้อมูลเมนูทั้งหมด

// ฟังก์ชันสำหรับเพิ่มสินค้าลงในตะกร้า
function addToCart(productId) {
    const productToAdd = allMenuItems.find(item => item.id == productId);
    if (!productToAdd) {
        console.error("ไม่พบสินค้า ID:", productId);
        return;
    }

    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const existingItem = cart.find(item => item.id == productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productToAdd.id,
            name: productToAdd.name,
            price: productToAdd.price,
            quantity: 1
        });
    }

    localStorage.setItem('kitsuCart', JSON.stringify(cart));
    renderCart();
}

// --- เพิ่มฟังก์ชันนี้เข้าไปใหม่ ---
// ฟังก์ชันสำหรับลบสินค้าออกจากตะกร้า
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const updatedCart = cart.filter(item => item.id != productId);
    localStorage.setItem('kitsuCart', JSON.stringify(updatedCart));
    renderCart();
}

// ฟังก์ชันสำหรับแสดงผลตะกร้า
function renderCart() {
    let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
    const cartContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total');

    if (!cartContainer || !cartTotalEl) return;

    cartContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center;">ตะกร้าของคุณว่างเปล่า</p>';
    } else {
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            // --- แก้ไข innerHTML ตรงนี้ ---
            itemElement.innerHTML = `
                <div class="cart-item-details">
                    <span>${item.name} (x${item.quantity})</span>
                    <span class="cart-item-price">฿${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
                <button class="remove-from-cart-btn" data-id="${item.id}">×</button>
            `;
            cartContainer.appendChild(itemElement);
            total += parseFloat(item.price) * item.quantity;
        });
    }
    cartTotalEl.textContent = total.toFixed(2);
}

// ===============================================
//           EVENT LISTENER (UPGRADED)
// ===============================================

document.addEventListener('click', function(event) {
    // --- ส่วนที่ 1: จัดการปุ่ม "เพิ่มลงตะกร้า" ---
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
        return; // หยุดการทำงานเมื่อเจอ
    }

    // --- ส่วนที่ 2: จัดการปุ่ม "ลบออกจากตะกร้า" ---
    const removeButton = event.target.closest('.remove-from-cart-btn');
    if (removeButton) {
        const productId = removeButton.getAttribute('data-id');
        removeFromCart(productId);
        return; // หยุดการทำงานเมื่อเจอ
    }

    // --- ส่วนที่ 3: จัดการปุ่ม "สั่งซื้อและชำระเงิน" (เพิ่มเข้ามาใหม่) ---
    const checkoutButton = event.target.closest('.checkout-btn');
    if (checkoutButton) {
        // ดึงข้อมูลตะกร้าปัจจุบันมาตรวจสอบ
        let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];

        if (cart.length > 0) {
            // ถ้าในตะกร้ามีของ
            alert('ขอบคุณสำหรับความสนใจ! ระบบชำระเงินกำลังจะเปิดให้บริการเร็วๆ นี้ครับ');
        } else {
            // ถ้าตะกร้าว่างเปล่า
            alert('กรุณาเลือกสินค้าลงตะกร้าก่อนนะครับ');
        }
    }
});