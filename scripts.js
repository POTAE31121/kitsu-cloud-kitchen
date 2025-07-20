// main.js หรือ script.js ของเว็บหน้าร้านคุณ

// รอให้หน้าเว็บโหลดเสร็จก่อน แล้วค่อยเริ่มทำงาน
document.addEventListener('DOMContentLoaded', () => {
    displayMenuItems();
});

// ฟังก์ชันสำหรับดึงข้อมูลและแสดงผลเมนู
async function displayMenuItems() {
    // URL ของ API หลังบ้านที่เราสร้างไว้
    const apiUrl = 'http://127.0.0.1:8000/api/items/';

    // หากล่องสำหรับใส่เมนูการ์ดในหน้า HTML ของเรา
    // **สำคัญ:** ตรวจสอบให้แน่ใจว่าคลาส '.menu-grid' หรือ '.menu-container' ถูกต้องตรงกับใน HTML ของคุณ
    const menuContainer = document.querySelector('.menu-grid'); 

    if (!menuContainer) {
        console.error('ไม่พบ Element สำหรับแสดงเมนู!');
        return;
    }

    try {
        // 1. ส่งคำขอไปดึงข้อมูลจาก API
        const response = await fetch(apiUrl);

        // 2. แปลงข้อมูลที่ได้กลับมาเป็น JSON (JavaScript Object)
        const menuItems = await response.json();

        // 3. ล้างคอนเทนเนอร์ให้ว่างเปล่า (เผื่อมีของเก่าค้างอยู่)
        menuContainer.innerHTML = '';

        // 4. วนลูปข้อมูลเมนูแต่ละชิ้นที่ได้มา เพื่อสร้างการ์ด HTML
        menuItems.forEach(item => {
            // สร้าง HTML ของการ์ดเมนู 1 ใบ
            const menuCardHTML = `
                <div class="menu-card">
                    <img src="${item.image}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p class="price">ราคา ${parseInt(item.price)} บาท</p> 
                    <p class="description">${item.description}</p>
                </div>
            `;
            // เพิ่มการ์ดที่เพิ่งสร้างเข้าไปในคอนเทนเนอร์
            menuContainer.insertAdjacentHTML('beforeend', menuCardHTML);
        });

    } catch (error) {
        // ถ้าเกิดข้อผิดพลาดในการดึงข้อมูล ให้แสดงใน Console
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเมนู:', error);
        menuContainer.innerHTML = '<p>ขออภัย, ไม่สามารถโหลดรายการเมนูได้ในขณะนี้</p>';
    }
}
