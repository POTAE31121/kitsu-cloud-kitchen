// ===============================================
// CONFIG
// ===============================================
const API_BASE_URL = 'https://kitsu-django-backend.onrender.com';

// ===============================================
// STATE
// ===============================================
const AppState = {
  menuItems: [],
  cart: []
};

// ===============================================
// UTILS
// ===============================================
const Storage = {
  loadCart() {
    try {
      return JSON.parse(localStorage.getItem('kitsuCart')) || [];
    } catch {
      return [];
    }
  },
  saveCart(cart) {
    localStorage.setItem('kitsuCart', JSON.stringify(cart));
  }
};

// ===============================================
// MENU SERVICE
// ===============================================
const MenuService = {
  async load() {
    const res = await fetch(`${API_BASE_URL}/api/items/`);
    if (!res.ok) throw new Error('Menu API failed');

    AppState.menuItems = await res.json();
  },

  getById(id) {
    return AppState.menuItems.find(i => String(i.id) === String(id));
  }
};

// ===============================================
// CART SERVICE
// ===============================================
const CartService = {
  init() {
    AppState.cart = Storage.loadCart();
  },

  add(id) {
    const product = MenuService.getById(id);
    if (!product) {
      console.error('Invalid product id:', id);
      return;
    }

    const item = AppState.cart.find(i => i.id === product.id);
    if (item) {
      item.quantity++;
    } else {
      AppState.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }

    Storage.saveCart(AppState.cart);
    CartUI.render();
  },

  decrease(id) {
    const item = AppState.cart.find(i => i.id == id);
    if (!item) return;

    item.quantity--;
    if (item.quantity <= 0) {
      AppState.cart = AppState.cart.filter(i => i.id != id);
    }

    Storage.saveCart(AppState.cart);
    CartUI.render();
  },

  remove(id) {
    AppState.cart = AppState.cart.filter(i => i.id != id);
    Storage.saveCart(AppState.cart);
    CartUI.render();
  }
};

// ===============================================
// UI - MENU
// ===============================================
const MenuUI = {
  render() {
    const grid = document.querySelector('.menu-grid');
    if (!grid) return;

    grid.innerHTML = '';

    AppState.menuItems.forEach(item => {
      grid.insertAdjacentHTML('beforeend', `
        <div class="menu-card">
          <img src="${item.image_url || 'https://via.placeholder.com/150'}">
          <h3>${item.name}</h3>
          <p>${item.price} บาท</p>
          <button class="add-to-cart-btn" data-id="${item.id}">
            เพิ่มลงตะกร้า
          </button>
        </div>
      `);
    });
  }
};

// ===============================================
// UI - CART
// ===============================================
const CartUI = {
  render() {
    const container = document.getElementById('modal-cart-items');
    const totalEl = document.getElementById('modal-cart-total');
    const badges = document.querySelectorAll('.cart-badge');
    const fab = document.getElementById('cart-fab');

    if (!container || !totalEl) return;

    container.innerHTML = '';

    if (AppState.cart.length === 0) {
      container.innerHTML = `<p class="empty-cart">ยังไม่มีสินค้า</p>`;
      totalEl.textContent = '0.00';
      badges.forEach(b => b.classList.add('hidden'));
      fab?.classList.add('hidden');
      return;
    }

    let total = 0;
    let qty = 0;

    AppState.cart.forEach(item => {
      total += item.price * item.quantity;
      qty += item.quantity;

      container.insertAdjacentHTML('beforeend', `
        <div class="cart-item">
          <span>${item.name}</span>
          <div class="cart-controls">
            <button data-action="increase" data-id="${item.id}">+</button>
            <span>${item.quantity}</span>
            <button data-action="decrease" data-id="${item.id}">-</button>
            <button data-action="remove" data-id="${item.id}">x</button>
          </div>
        </div>
      `);
    });

    totalEl.textContent = total.toFixed(2);
    badges.forEach(b => {
      b.textContent = qty;
      b.classList.toggle('hidden', qty === 0);
    });
    fab?.classList.toggle('hidden', qty === 0);
  }
};

// ===============================================
// EVENTS
// ===============================================
function bindEvents() {
  document.addEventListener('click', e => {

    // ADD TO CART
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      CartService.add(addBtn.dataset.id);
      return;
    }

    // CART CONTROLS
    const ctrl = e.target.closest('[data-action]');
    if (!ctrl) return;

    const { action, id } = ctrl.dataset;
    if (action === 'increase') CartService.add(id);
    if (action === 'decrease') CartService.decrease(id);
    if (action === 'remove') CartService.remove(id);
  });
}

// ===============================================
// BOOTSTRAP
// ===============================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    CartService.init();
    CartUI.render();

    if (document.querySelector('.menu-grid')) {
      await MenuService.load();   // ✅ เมนูต้องโหลดก่อน
      MenuUI.render();
    }

    bindEvents();
  } catch (err) {
    console.error(err);
    alert('ระบบโหลดไม่สำเร็จ');
  }
});
