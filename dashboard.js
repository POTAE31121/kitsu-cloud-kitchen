// ===============================================
//           DASHBOARD MASTER SCRIPT (V3 - FINAL)
// ===============================================

const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';
let realtimeInterval;

// ===============================================
//           INITIALIZATION & SECURITY
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('kitsuAdminToken');
    const onLoginPage = window.location.pathname.endsWith('login.html') || !window.location.pathname.includes('dashboard.html');

    if (token && onLoginPage) {
        window.location.href = 'dashboard.html';
    } else if (!token && !onLoginPage) {
        window.location.href = 'login.html';
    }

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
        const loginBtn = document.querySelector('.login-btn');

        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        errorEl.textContent = '';

        try {
            const response = await fetch(`${API_BASE_URL}/api/token-auth/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            
            const data = await response.json();
            localStorage.setItem('kitsuAdminToken', data.token);
            window.location.href = 'dashboard.html';

        } catch (error) {
            errorEl.textContent = 'Login failed. Please check username/password.';
            console.error('Login Error:', error);
        } finally {
            loginBtn.textContent = 'Log In';
            loginBtn.disabled = false;
        }
    });
}

// ===============================================
//           DASHBOARD PAGE LOGIC
// ===============================================

function initializeDashboardPage() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('kitsuAdminToken');
            clearInterval(realtimeInterval);
            window.location.href = 'login.html';
        });
    }

    // ⭐️ เปิดใช้งาน Modal ดูสลิป
    initializeSlipModal();

    // Fetch and render initial data
    fetchAndRenderAllData();
    
    // Start realtime updates
    startRealtimeUpdates();
    
    // ⭐️ Event Delegation ที่จัดการทั้ง 'change' และ 'click'
    const orderListBody = document.getElementById('order-list-body');
    if (orderListBody) {
        orderListBody.addEventListener('change', handleStatusChange);
        orderListBody.addEventListener('click', handleDashboardClick);
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
    realtimeInterval = setInterval(fetchAndRenderAllData, 5000); 
}

// ดึง "ข้อมูลสรุป" สำคัญมาก!!!
async function fetchDashboardStats() {
    const token = localStorage.getItem('kitsuAdminToken');
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.status === 401 || response.status === 403) {
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

// --- ⭐️ ผู้คุม ฉบับแก้ไข ⭐️ ---
async function fetchAndRenderOrders() {
    const token = localStorage.getItem('kitsuAdminToken');
    const orderListBody = document.getElementById('order-list-body');
    if (!orderListBody) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.status === 401 || response.status === 403) { handleUnauthorized(); return; }
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        
        orderListBody.innerHTML = '';
        if (orders.length === 0) {
            orderListBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No orders yet.</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            let statusOptions = '';
            ['PENDING', 'AWAITING_PAYMENT', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'].forEach(status => {
                const selected = order.status === status ? 'selected' : '';
                statusOptions += `<option value="${status}" ${selected}>${status}</option>`;
            });

            // สร้างปุ่มดูสลิป
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
    } catch (error) {
        orderListBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Error loading orders.</td></tr>`;
        console.error(error);
    }
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
        selectElement.style.backgroundColor = '#2ecc71';
        setTimeout(() => { selectElement.style.backgroundColor = ''; }, 1000);

        await fetchAndRenderOrders(); // Refresh orders after update

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