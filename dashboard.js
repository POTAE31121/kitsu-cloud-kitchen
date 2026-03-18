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
    // ปรับปรุงให้รองรับการเข้าหน้าแรกสุดด้วย
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
        orderListBody.addEventListener('change', handleDropdownChange)  // เปลี่ยนจาก handleStatusChange
        orderListBody.addEventListener('click', handleDashboardClick)
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
    realtimeInterval = setInterval(fetchAndRenderAllData, 15000); 
}

// ดึง "ข้อมูลสรุป"
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
        const todaysRevenueEl = document.getElementById('stats-todays-revenue');
        const todaysOrdersEl = document.getElementById('stats-todays-orders');
        const totalOrdersEl = document.getElementById('stats-total-orders');

        if (todaysRevenueEl) todaysRevenueEl.textContent = stats.todays_revenue;
        if (todaysOrdersEl) todaysOrdersEl.textContent = stats.todays_orders_count;
        if (totalOrdersEl) totalOrdersEl.textContent = stats.total_orders_count;

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
        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        
        orderListBody.innerHTML = '';
        if (orders.length === 0) {
            orderListBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No orders yet.</td></tr>`;
            return;
        }

    orders.forEach(order => {
        const row = document.createElement('tr')

        // สร้าง dropdown เฉพาะ status ที่ทำได้
        const VALID_TRANSITIONS = {
            'AWAITING_PAYMENT': ['PAID', 'CANCELLED'],
            'PAID':             ['PREPARING', 'CANCELLED'],
            'PREPARING':        ['DELIVERING', 'CANCELLED'],
            'DELIVERING':       ['COMPLETED', 'CANCELLED'],
            'COMPLETED':        ['COMPLETED'], // ไม่มี transition แต่ยังคงแสดง badge สีเขียว
            'CANCELLED':        ['CANCELLED']  // ไม่มี transition แต่ยังคงแสดง badge สีแดง,
        }

        const allowed = VALID_TRANSITIONS[order.status] || []

        // ถ้าไม่มี transition แล้ว แสดง badge แทน dropdown
        let statusCell = ''
        if (allowed.length === 0) {
            const color = order.status === 'COMPLETED' ? '#27ae60' : '#e74c3c'
            statusCell = `<td><span style="padding: 4px 10px; border-radius: 12px; background: ${color}; color: white; font-size: 0.85em;">${order.status}</span></td>`
        } else {
            let options = `<option value="" disabled selected>${order.status}</option>`
            allowed.forEach(s => {
                options += `<option value="${s}">${s}</option>`
            })
            statusCell = `
                <td style="display: flex; gap: 8px; align-items: center;">
                    <select class="status-select" data-order-id="${order.id}">
                        ${options}
                    </select>
                    <button 
                        class="confirm-status-btn" 
                        data-order-id="${order.id}"
                        style="padding: 5px 10px; background: #f5a623; color: white; border: none; border-radius: 4px; cursor: pointer; opacity: 0.4; pointer-events: none;">
                        Confirm
                    </button>
                </td>
            `
        }

        const slipCell = order.payment_slip_url
            ? `<td><button class="view-slip-btn" data-slip-url="${order.payment_slip_url}">📎</button></td>`
            : '<td>-</td>'

        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>${order.customer_phone}</td>
            <td>฿${parseFloat(order.total_price).toFixed(2)}</td>
            ${statusCell}
            <td>${new Date(order.created_at).toLocaleString('en-GB')}</td>
            ${slipCell}
        `
        orderListBody.appendChild(row)
        })
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
        if(modal && overlay) {
            modal.classList.add('hidden');
            overlay.classList.add('hidden');
        }
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

// "เปลี่ยนสถานะ"
// handle confirm status button
    const confirmBtn = event.target.closest('.confirm-status-btn')
        if (confirmBtn) {
            const orderId = confirmBtn.dataset.orderId
            const row = confirmBtn.closest('tr')
            const select = row?.querySelector('.status-select')
            const newStatus = select?.value

            if (!newStatus) {
                alert('กรุณาเลือก status ก่อนครับ')
                return
            }

            if (confirm(`ยืนยันการเปลี่ยน Order #${orderId} เป็น ${newStatus}?`)) {
                handleConfirmStatus(orderId, newStatus, row)
            }
        }

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

            // --- หัวใจของการอัปเดต ---
            console.log("Status changed, forcing data refresh...");
            await fetchAndRenderAllData(); 
            // ------------------------

        } catch (error) {
            console.error('Update failed:', error);
            alert('Could not update order status.');
            fetchAndRenderOrders(); // Revert dropdown on failure
        }

// เปิด Confirm button เมื่อเลือก dropdown
function handleDropdownChange(event) {
    if (!event.target.classList.contains('status-select')) return

    const select = event.target
    const row = select.closest('tr')
    const confirmBtn = row?.querySelector('.confirm-status-btn')

    if (confirmBtn) {
        if (select.value) {
            confirmBtn.style.opacity = '1'
            confirmBtn.style.pointerEvents = 'auto'
        } else {
            confirmBtn.style.opacity = '0.4'
            confirmBtn.style.pointerEvents = 'none'
        }
    }
}

// กด Confirm แล้วส่ง API
async function handleConfirmStatus(orderId, newStatus, row) {
    const token = localStorage.getItem('kitsuAdminToken')

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/orders/${orderId}/update-status/`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            alert(`ไม่สามารถเปลี่ยน status ได้\n${data.error}`)
            return
        }

        console.log(`Order #${orderId} updated to ${newStatus}`)
        await fetchAndRenderAllData()

    } catch (error) {
        console.error('Update failed:', error)
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
}

// --- Helper Functions ---
function handleUnauthorized() {
    localStorage.removeItem('kitsuAdminToken');
    clearInterval(realtimeInterval);
    window.location.href = 'login.html';
}