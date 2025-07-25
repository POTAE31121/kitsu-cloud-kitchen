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
    initializeCartModal(); // เปิดใช้งาน Modal ตะกร้า
    initializeCheckoutModal(); // ⭐️ เปิดใช้งาน Modal ชำระเงิน
});

async function displayMenuItems() {
    // ... โค้ดส่วนนี้เหมือนเดิมทุกประการ ...
    // (ฟังก์ชันนี้ทำหน้าที่ดึงเมนูมาแสดง)
}

// ===============================================
//           SHOPPING CART LOGIC
// ===============================================
let allMenuItems = [];

// ... โค้ด addToCart, removeFromCart (เหมือนเดิมทุกประการ) ...

function renderCart() {
    // ... โค้ดส่วนนี้เหมือนเดิมทุกประการ ...
    // (ฟังก์ชันนี้ทำหน้าที่อัปเดต UI ของตะกร้า)
}


// ===============================================
//           MODAL & CHECKOUT LOGIC
// ===============================================
function initializeCartModal() {
    // ... โค้ดส่วนนี้เหมือนเดิมทุกประการ ...
    // (ฟังก์ชันนี้ทำหน้าที่เปิด/ปิด Modal ตะกร้า)
}

// --- ฟังก์ชันใหม่สำหรับจัดการ Checkout Modal ---
function initializeCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutOverlay = document.getElementById('checkout-modal-overlay');
    const checkoutCloseBtn = document.getElementById('checkout-close-btn');
    const checkoutForm = document.getElementById('checkout-form');

    function openCheckoutModal() {
        // ปิดตะกร้าก่อนเปิดหน้าจ่ายเงิน
        document.getElementById('cart-modal').classList.add('hidden');
        document.getElementById('cart-modal-overlay').classList.add('hidden');
        // เปิดหน้าจ่ายเงิน
        checkoutModal.classList.remove('hidden');
        checkoutOverlay.classList.remove('hidden');
    }
    function closeCheckoutModal() {
        checkoutModal.classList.add('hidden');
        checkoutOverlay.classList.add('hidden');
    }

    if(checkoutModal && checkoutOverlay && checkoutCloseBtn && checkoutForm) {
        checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
        checkoutOverlay.addEventListener('click', closeCheckoutModal);
        checkoutForm.addEventListener('submit', handleOrderSubmit);
    }
    
    // Event Listener เฉพาะสำหรับปุ่ม "สั่งซื้อและชำระเงิน" ในตะกร้า
    const openCheckoutBtn = document.querySelector('#cart-modal .checkout-btn');
    if (openCheckoutBtn) {
        openCheckoutBtn.addEventListener('click', function() {
            let cart = JSON.parse(localStorage.getItem('kitsuCart')) || [];
            if (cart.length > 0) {
                openCheckoutModal();
            } else {
                alert('กรุณาเลือกสินค้าลงตะกร้าก่อนนะครับ');
            }
        });
    }
}

// --- ฟังก์ชันใหม่สำหรับส่งออเดอร์ไปที่ Backend ---
async function handleOrderSubmit(event) {
    event.preventDefault(); // ป้องกันหน้าเว็บรีโหลด

    const submitBtn = document.getElementById('confirm-order-btn');
    submitBtn.textContent = 'กำลังส่ง...';
    submitBtn.disabled = true;

    // 1. รวบรวมข้อมูล
    const customer_name = document.getElementById('customer_name').value;
    const customer_phone = document.getElementById('customer_phone').value;
    const customer_address = document.getElementById('customer_address').value;
    const cartItems = JSON.parse(localStorage.getItem('kitsuCart')) || [];

    // 2. จัดรูปแบบข้อมูลให้ตรงกับที่ Backend ต้องการ
    const orderData = {
        customer_name,
        customer_phone,
        customer_address,
        items: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
    };

    // 3. ส่ง POST Request ด้วย fetch
    try {
        const response = await fetch('https://kitsu-backend.onrender.com/api/orders/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'X-CSRFToken': '... ' // Django REST Framework ไม่จำเป็นต้องใช้ CSRF token สำหรับ API View โดยปกติ
            },
            body: JSON.stringify(orderData),
        });

        if (response.ok) {
            // ถ้าสำเร็จ
            localStorage.removeItem('kitsuCart'); // ล้างตะกร้า
            renderCart(); // อัปเดต UI ตะกร้าให้ว่างเปล่า
            document.getElementById('checkout-modal').classList.add('hidden');
            document.getElementById('checkout-modal-overlay').classList.add('hidden');
            alert('ขอบคุณสำหรับคำสั่งซื้อ! ออเดอร์ของคุณถูกส่งเรียบร้อยแล้ว');
        } else {
            // ถ้าไม่สำเร็จ
            const errorData = await response.json();
            alert('เกิดข้อผิดพลาด: ' + JSON.stringify(errorData));
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        console.error('Order Submit Error:', error);
    } finally {
        submitBtn.textContent = 'ยืนยันคำสั่งซื้อ';
        submitBtn.disabled = false;
    }
}

// --- Event Listener ฉบับสมบูรณ์ (จัดการแค่ปุ่ม Add/Remove) ---
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
});