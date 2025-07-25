// ===============================================
//           CORE & MENU DISPLAY LOGIC
// ===============================================

document.addEventListener('DOMContentLoaded', () => {

    // --- ส่วนที่ 1: โค้ดสำหรับจัดการเมนูสไลด์ ---
    const toggle = document.getElementById('menu-toggle');
    const slideMenu = document.getElementById('slide-menu');

    if (toggle && slideMenu) {
        // ... (โค้ดส่วนนี้เหมือนเดิมทุกประการ) ...
        toggle.addEventListener('click', () => { slideMenu.classList.toggle('active'); });
        document.querySelectorAll('#slide-menu a').forEach(link => {
            link.addEventListener('click', () => { slideMenu.classList.remove('active'); });
        });
        slideMenu.addEventListener('click', (e) => {
            if (e.target === slideMenu) { slideMenu.classList.remove('active'); }
        });
    }

    // --- ส่วนที่ 2: เรียกใช้ฟังก์ชันหลัก ---
    displayMenuItems(); // แสดงผลเมนู
    renderCart();       // แสดงผลตะกร้า (จาก localStorage)
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
        if (!response.ok) { // ตรวจสอบว่า API ตอบกลับสำเร็จหรือไม่
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const menuItems = await response.json();

        menuContainer.innerHTML = '';

        menuItems.forEach(item => {
            const menuCardHTML = `
                <div class="menu-card">
                    <img src="${item.image_url}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p class="price">฿${parseInt(item.price)}</p>
                    
                    <!-- เพิ่มปุ่ม "Add to Cart" -->
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

// ข้อมูลเมนูทั้งหมด (เพื่อไม่ต้อง fetch ซ้ำบ่อยๆ)
let allMenuItems = [];

// ดึงข้อมูลเมนูทั้งหมดมาเก็บไว้ครั้งเดียวเมื่อเว็บโหลด
async function fetchAllMenuItems() {
    try {
        const response = await fetch('https://kitsu-backend.onrender.com/api/items/');
        allMenuItems = await response.json();
    } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลเมนูหลักได้:", error);
    }
}
// เรียกใช้ฟังก์ชันนี้ทันทีที่ไฟล์ถูกอ่าน
fetchAllMenuItems();


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
            itemElement.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>฿${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
            `;
            cartContainer.appendChild(itemElement);
            total += parseFloat(item.price) * item.quantity;
        });
    }
    cartTotalEl.textContent = total.toFixed(2);
}

// Event Delegation สำหรับปุ่ม "เพิ่มลงตะกร้า"
document.addEventListener('click', function(event) {
    // เราจะใช้ document ในการดักฟัง event เพื่อให้แน่ใจว่ามันทำงานหลัง menu-grid ถูกสร้าง
    if (event.target && event.target.closest('.add-to-cart-btn')) {
        const button = event.target.closest('.add-to-cart-btn');
        const productId = button.getAttribute('data-id');
        addToCart(productId);
        // อาจจะเปลี่ยนเป็น feedback ที่ดีกว่า alert
        button.textContent = 'เพิ่มแล้ว!';
        setTimeout(() => {
            button.textContent = 'เพิ่มลงตะกร้า';
        }, 1000);
    }
});