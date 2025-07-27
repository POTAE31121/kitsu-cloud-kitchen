// ===============================================
//           DASHBOARD MASTER SCRIPT
// ===============================================
const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';

// --- 1. Security Check: ตรวจสอบการล็อกอินทุกครั้งที่โหลดหน้า ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('kitsuAdminToken');
    const onLoginPage = window.location.pathname.endsWith('login.html');

    if (token && onLoginPage) {
        // ถ้ามี token และอยู่หน้า login, ให้เด้งไป dashboard
        window.location.href = 'dashboard.html';
    } else if (!token && !onLoginPage) {
        // ถ้าไม่มี token และไม่ได้อยู่หน้า login, ให้เด้งไป login
        window.location.href = 'login.html';
    }

    // --- 2. Initialize Page-Specific Logic ---
    if (onLoginPage) {
        initializeLoginPage();
    } else {
        initializeDashboardPage();
    }
});


// --- 3. Logic สำหรับหน้า Login ---
function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
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
            if (!response.ok) throw new Error('Invalid credentials');
            
            const data = await response.json();
            localStorage.setItem('kitsuAdminToken', data.token);
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorEl.textContent = 'Login failed. Please try again.';
        }
    });
}

// --- 4. Logic สำหรับหน้า Dashboard ---
function initializeDashboardPage() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('kitsuAdminToken');
        window.location.href = 'login.html';
    });

    // Fetch and render orders
    fetchAndRenderOrders();
    
    // Listen for status changes
    const orderListBody = document.getElementById('order-list-body');
    orderListBody.addEventListener('change', handleStatusChange);
}

async function fetchAndRenderOrders() {
    const token = localStorage.getItem('kitsuAdminToken');
    const orderListBody = document.getElementById('order-list-body');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (response.status === 401) { // Unauthorized
            localStorage.removeItem('kitsuAdminToken');
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        
        orderListBody.innerHTML = ''; // Clear existing
        orders.forEach(order => {
            const row = document.createElement('tr');
            
            // สร้าง Dropdown สำหรับ Status
            let statusOptions = '';
            ['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'].forEach(status => {
                const selected = order.status === status ? 'selected' : '';
                statusOptions += `<option value="${status}" ${selected}>${status}</option>`;
            });

            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.customer_name}</td>
                <td>${order.customer_phone}</td>
                <td>฿${parseFloat(order.total_price).toFixed(2)}</td>
                <td>
                    <select class="status-select" data-order-id="${order.id}">
                        ${statusOptions}
                    </select>
                </td>
                <td>${new Date(order.created_at).toLocaleString()}</td>
            `;
            orderListBody.appendChild(row);
        });
    } catch (error) {
        orderListBody.innerHTML = `<tr><td colspan="6">Error loading orders.</td></tr>`;
        console.error(error);
    }
}

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
        
        // Optionally show a success message
        console.log(`Order #${orderId} status updated to ${newStatus}`);

    } catch (error) {
        console.error('Update failed:', error);
        alert('Could not update order status.');
        // Revert dropdown on failure
        fetchAndRenderOrders(); 
    }
}