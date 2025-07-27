// ===============================================
//           DASHBOARD MASTER SCRIPT (V2 - REALTIME)
// ===============================================

const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';
let realtimeInterval; // ตัวแปรสำหรับเก็บ interval เพื่อให้เราสั่งหยุดได้

// ===============================================
//           INITIALIZATION & SECURITY
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('kitsuAdminToken');
    const onLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/');

    if (token && onLoginPage) {
        // ถ้ามี token และอยู่หน้า login, ให้เด้งไป dashboard
        window.location.href = 'dashboard.html';
    } else if (!token && !onLoginPage) {
        // ถ้าไม่มี token และไม่ได้อยู่หน้า login, ให้เด้งไป login
        window.location.href = 'login.html';
    }

    // Initialize Page-Specific Logic
    if (onLoginPage) {
        initializeLoginPage();
    } else {
        initializeDashboardPage();
    }
});

// ===============================================
//           LOGIN PAGE LOGIC
// ===============================================

function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/token-auth/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) {
                // พยายามอ่าน error message จาก backend
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.non_field_errors?.[0] || 'Invalid credentials');
            }
            
            const data = await response.json();
            localStorage.setItem('kitsuAdminToken', data.token);
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorEl.textContent = 'Login failed. Please check username/password.';
            console.error('Login Error:', error);
        }
    });
}

// ===============================================
//           DASHBOARD PAGE LOGIC
// ===============================================

function initializeDashboardPage() {
    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('kitsuAdminToken');
            clearInterval(realtimeInterval); // หยุดการรีเฟรชเมื่อ Logout
            window.location.href = 'login.html';
        });
    }

    // Fetch and render initial data
    fetchAndRenderAllData();
    
    // Start realtime updates (Polling)
    startRealtimeUpdates();
    
    // Listen for status changes in the order table
    const orderListBody = document.getElementById('order-list-body');
    if (orderListBody) {
        orderListBody.addEventListener('change', handleStatusChange);
    }
}

// "ผู้จัดการ" ที่เรียกทุกอย่าง
async function fetchAndRenderAllData() {
    console.log("Fetching latest data...");
    await fetchDashboardStats();
    await fetchAndRenderOrders();
}

// เปิด "หน้าจอเรดาร์"
function startRealtimeUpdates() {
    // รีเฟรชข้อมูลทุก 15 วินาที
    realtimeInterval = setInterval(fetchAndRenderAllData, 5000); 
}

// Initialize the new Slip Model
initalizeSlipModal();{

const orderListBody = document.getElementById('order-list-body');
if (orderListBody) {

        orderListBody.addEventListener('change', handleStatusChange);
        orderListBody.addEventListener('click', handleDashboardClick);
    }
}

// ดึง "ข้อมูลสรุป"
async function fetchDashboardStats() {
    const token = localStorage.getItem('kitsuAdminToken');
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.status === 401) {
             handleUnauthorized();
             return;
        }
        if (!response.ok) return;
        
        const stats = await response.json();
        document.getElementById('stats-todays-revenue').textContent = stats.todays_revenue;
        document.getElementById('stats-todays-orders').textContent = stats.todays_orders_count;
        document.getElementById('stats-total-orders').textContent = stats.total_orders_count;
    } catch (error) {
        console.error("Failed to fetch stats:", error);
    }
}

// ⭐️ ฟังก์ชัน fetchAndRenderOrders ฉบับอัปเกรด ⭐️
async function fetchAndRenderOrders() {
    const token = localStorage.getItem('kitsuAdminToken');
    const orderListBody = document.getElementById('order-list-body');
    if (!orderListBody) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.status === 401) { handleUnauthorized(); return; }
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        
        orderListBody.innerHTML = '';
        if (orders.length === 0) { /* ... */ return; }

        orders.forEach(order => {
            const row = document.createElement('tr');
            let statusOptions = '';
            // ... (โค้ดสร้าง statusOptions เดิม) ...

            // --- สร้างปุ่มดูสลิป ---
            const slipCell = order.payment_slip_url
                ? `<td><button class="view-slip-btn" data-slip-url="${order.payment_slip_url}">📎</button></td>`
                : '<td>-</td>';

            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.customer_name}</td>
                <td>${order.customer_phone}</td>
                <td>฿${parseFloat(order.total_price).toFixed(2)}</td>
                <td><select class="status-select" data-order-id="${order.id}">${statusOptions}</select></td>
                <td>${new Date(order.created_at).toLocaleString('en-GB')}</td>
                ${slipCell}
            `;
            orderListBody.appendChild(row);
        });
    } catch (error) { /* ... */ }
}

// ⭐️ ฟังก์ชันใหม่สำหรับจัดการ Slip Modal ⭐️
function initializeSlipModal() {
    const modal = document.getElementById('slip-modal');
    const overlay = document.getElementById('slip-modal-overlay');
    const closeBtn = document.getElementById('slip-modal-close-btn');

    function closeModal() {
        modal.classList.add('hidden');
        overlay.classList.add('hidden');
    }

    if(modal && overlay && closeBtn) {
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
    }
}

// ⭐️ ฟังก์ชันใหม่สำหรับจัดการการคลิกในตาราง ⭐️
function handleDashboardClick(event) {
    const viewSlipBtn = event.target.closest('.view-slip-btn');
    if (viewSlipBtn) {
        const slipUrl = viewSlipBtn.dataset.slipUrl;
        const modal = document.getElementById('slip-modal');
        const overlay = document.getElementById('slip-modal-overlay');
        const imageEl = document.getElementById('slip-modal-image');

        if(modal && overlay && imageEl && slipUrl) {
            imageEl.src = slipUrl;
            modal.classList.remove('hidden');
            overlay.classList.remove('hidden');
        }
    }
}

function handleDashboardClick(event) {
    const viewSlipBtn = event.target.closest('.view-slip-btn');
    if (viewSlipBtn) {
        const slipUrl = viewSlipBtn.dataset.slipUrl;
        const modal = document.getElementById('slip-modal');
        const overlay = document.getElementById('slip-modal-overlay');
        const imageEl = document.getElementById('slip-modal-image');

        if(modal && overlay && imageEl && slipUrl) {
            imageEl.src = slipUrl;
            modal.classList.remove('hidden');
            overlay.classList.remove('hidden');
        }
    }
}

// "เปลี่ยนสถานะ"
async function handleStatusChange(event) {
    if (!event.target.classList.contains('status-select')) return;

    const token = localStorage.getItem('kitsuAdminToken');
    const selectElement = event.target;
    const orderId = selectElement.dataset.orderId;
    const newStatus = selectElement.value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/update-status/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error('Failed to update status');
        
        console.log(`Order #${orderId} status updated to ${newStatus}`);
        // Optionally add a visual confirmation
        selectElement.style.backgroundColor = '#2ecc71';
        setTimeout(() => { selectElement.style.backgroundColor = ''; }, 1000);

    } catch (error) {
        console.error('Update failed:', error);
        alert('Could not update order status.');
        fetchAndRenderOrders(); // Revert dropdown on failure
    }
}

// --- 5. Helper Functions ---
function handleUnauthorized() {
    localStorage.removeItem('kitsuAdminToken');
    clearInterval(realtimeInterval);
    window.location.href = 'login.html';
}