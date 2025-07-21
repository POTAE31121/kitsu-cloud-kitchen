// scripts.js

// รอให้เอกสาร HTML โหลดเสร็จสมบูรณ์ก่อน ค่อยเริ่มทำงานทั้งหมด
document.addEventListener('DOMContentLoaded', () => {

    // --- ส่วนที่ 1: โค้ดสำหรับจัดการเมนูสไลด์ (โค้ดเดิมของคุณ) ---
    const toggle = document.getElementById('menu-toggle');
    const slideMenu = document.getElementById('slide-menu');

    if (toggle && slideMenu) {
        // กดปุ่ม ☰ เพื่อเปิด/ปิดเมนู
        toggle.addEventListener('click', () => {
            slideMenu.classList.toggle('active');
        });

        // กดลิงก์ในเมนูแล้วปิดเมนูด้วย
        document.querySelectorAll('#slide-menu a').forEach(link => {
            link.addEventListener('click', () => {
                slideMenu.classList.remove('active');
            });
        });

        // กดพื้นที่ว่างรอบ ๆ เมนูเพื่อปิดเมนู
        slideMenu.addEventListener('click', (e) => {
            if (e.target === slideMenu) {
                slideMenu.classList.remove('active');
            }
        });
    }

    // --- ส่วนที่ 2: ปิดการใช้งานฟังก์ชันดึงข้อมูลเมนูชั่วคราว ---
    // displayMenuItems(); // <--- ใส่ // ไว้ข้างหน้าบรรทัดนี้

});


// ฟังก์ชันสำหรับดึงข้อมูลและแสดงผลเมนู
// เราไม่ต้องลบฟังก์ชันนี้ทิ้ง ปล่อยมันไว้อย่างนี้ได้เลย
// ในอนาคตเมื่อเราพร้อมจะเปิดตัว เราแค่กลับมาลบ // ข้างบนออก มันก็จะกลับมาทำงานเหมือนเดิม
async function displayMenuItems() {
    // URL ของ API หลังบ้านที่เราสร้างไว้
    const apiUrl = 'https://kitsu-backend.onrender.com/api/menu';

    // หากล่องสำหรับใส่เมนูการ์ด (จาก HTML ของคุณคือคลาส .menu-grid)
    const menuContainer = document.querySelector('.menu-grid');

    // ตรวจสอบก่อนว่าเจอกล่องนี้ในหน้าเว็บหรือไม่
    if (!menuContainer) {
        console.error('Error: ไม่พบ Element ที่มีคลาส .menu-grid');
        return;
    }

    try {
        // 1. ส่งคำขอไปดึงข้อมูลจาก API
        const response = await fetch(apiUrl);
        // 2. แปลงข้อมูลที่ได้กลับมาเป็น JSON (JavaScript Object)
        const menuItems = await response.json();

        // 3. ล้างคอนเทนเนอร์ให้ว่างเปล่า
        menuContainer.innerHTML = '';

        // 4. วนลูปข้อมูลเมนูแต่ละชิ้นที่ได้มา เพื่อสร้างเป็นการ์ด HTML
        menuItems.forEach(item => {
            // สร้าง HTML ของการ์ดเมนู 1 ใบ
            // สังเกตว่า src ของ img เราใช้ item.image ที่ได้จาก API
            const menuCardHTML = `
                <div class="menu-card">
                    <img src="${item.image}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p>฿${parseInt(item.price)}</p>
                </div>
            `;
            // เพิ่มการ์ดที่เพิ่งสร้างเข้าไปในคอนเทนเนอร์
            menuContainer.insertAdjacentHTML('beforeend', menuCardHTML);
        });

    } catch (error) {
        // ถ้าเกิดข้อผิดพลาดในการดึงข้อมูล (เช่น ลืมเปิดเซิร์ฟเวอร์หลังบ้าน)
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเมนู:', error);
        menuContainer.innerHTML = '<p style="color: red; text-align: center;">ขออภัย, ไม่สามารถโหลดรายการเมนูได้ในขณะนี้</p>';
    }
}