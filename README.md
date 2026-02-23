# 🍱 Kitsu Cloud Kitchen — Full-Stack Web Application

A full-stack food ordering web application built as a portfolio project to demonstrate production-grade software engineering practices.

**Developed by:** Peerapong Thongnuch (ภีระพงศ์ ทองนุช)
**GitHub:** [@POTAE31121](https://github.com/POTAE31121)

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| Frontend | https://potae31121.github.io/kitsu-cloud-kitchen/ |
| Backend API | https://kitsu-django-backend.onrender.com/api/ |

---

## 📌 Project Overview

Kitsu Cloud Kitchen simulates a real-world cloud kitchen ordering system — from browsing the menu to placing an order, simulating payment, and tracking delivery status in real time.

This project was designed with **production-grade thinking** in mind, covering API design, payment flow, order lifecycle management, admin dashboard, and automated testing.

---

## ✨ Features

### Customer-Facing
- 🍽️ **Menu Browsing** — Display menu items with images (hosted on Cloudinary), prices, and descriptions
- 🛒 **Shopping Cart** — Add/remove items with real-time total calculation
- 📋 **Multi-step Checkout** — Delivery info → Payment → Order confirmation
- 💳 **Payment Simulator** — Simulates payment success/failure flow with QR Code UI
- 📦 **Order Tracking** — Track order status from `Awaiting Payment` → `Preparing` → `Out for Delivery` → `Completed`

### Admin-Facing
- 🔐 **Token-based Authentication** — Secure admin login via DRF Token Auth
- 📊 **Dashboard Stats** — Today's revenue, order counts (timezone-aware, Asia/Bangkok)
- 📋 **Order Management** — View all orders and update order status
- 🔔 **Telegram Notifications** — Instant notifications on new orders and payment confirmation

### Payment System
- 🔄 **Payment Intent Flow** — Generate unique payment intent ID per order
- 🪝 **Webhook Handler** — Process payment results with idempotency protection (prevents double-processing)
- 🧩 **Extensible Webhook Architecture** — Separate handlers ready for Stripe and Omise integration
- 🧾 **Payment Slip Upload** — Support for manual slip upload flow

---

## 🛠️ Tech Stack

### Backend
| Technology | Usage |
|---|---|
| Python 3.12 | Core language |
| Django 5.2 | Web framework |
| Django REST Framework | API layer |
| PostgreSQL | Primary database |
| Cloudinary | Image storage (menu images, payment slips) |
| Gunicorn | Production WSGI server |
| Render | Cloud deployment |

### Frontend
| Technology | Usage |
|---|---|
| HTML / CSS / JavaScript | UI (Vanilla, no framework) |
| GitHub Pages | Static hosting |

---

## 🏗️ System Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Frontend          │         │   Backend (Django DRF)   │
│   GitHub Pages      │ ──────► │   Render (Cloud)         │
│   HTML/CSS/JS       │         │   REST API               │
└─────────────────────┘         └──────────┬───────────────┘
                                            │
                          ┌─────────────────┼──────────────┐
                          │                 │              │
                   ┌──────▼─────┐  ┌───────▼──────┐  ┌───▼──────────┐
                   │ PostgreSQL │  │  Cloudinary  │  │  Telegram    │
                   │ Database   │  │  (Images)    │  │  Bot API     │
                   └────────────┘  └──────────────┘  └──────────────┘
```

---

## 📂 Project Structure

```
kitsu-django-backend/
├── kitsu_backend/          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── views.py
├── menu/                   # Main application
│   ├── models.py           # MenuItem, Order, OrderItem
│   ├── views.py            # API Views
│   ├── serializers.py      # DRF Serializers
│   ├── urls.py             # URL routing
│   ├── webhooks.py         # Payment webhook handlers
│   ├── services.py         # Business logic layer
│   └── tests.py            # Unit & API tests
├── manage.py
├── requirements.txt
├── build.sh                # Render build script
└── pytest.ini              # Test configuration
```

---

## 🔄 Order Lifecycle

```
[Create Order] → AWAITING_PAYMENT / UNPAID
      │
      ▼
[Generate Payment Intent] → intent_id created
      │
      ▼
[Payment Simulator] → user confirms or cancels
      │
      ├── success → PAID / PREPARING → Telegram notification sent
      │
      └── failed  → FAILED
```

---

## 🧪 Running Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with verbose output
pytest -v
```

**Test Coverage includes:**
- ✅ Menu API — returns only available items
- ✅ Order creation — success, empty items, invalid item ID
- ✅ Order status retrieval — found and not found cases
- ✅ Payment webhook — success, failure, and idempotency protection

---

## 🚀 Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/POTAE31121/kitsu-django-backend.git
cd kitsu-django-backend

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
cp .env.example .env
# Fill in your environment variables

# 5. Run migrations
python manage.py migrate

# 6. Start development server
python manage.py runserver
```

---

## ⚙️ Environment Variables

```env
SECRET_KEY=your_django_secret_key
DEBUG=False
DATABASE_URL=your_postgresql_url
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

---

## 📡 API Endpoints

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/items/` | List available menu items |
| POST | `/api/orders/submit-final/` | Create a new order |
| GET | `/api/orders/<id>/` | Get order status |
| PATCH | `/api/orders/<id>/upload-slip/` | Upload payment slip |
| POST | `/api/payment/create-intent/` | Generate payment intent |
| GET | `/api/payment/status/<intent_id>/` | Poll payment status |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webhook/simulator/` | Payment simulator webhook |
| POST | `/api/webhook/stripe/` | Stripe webhook (placeholder) |
| POST | `/api/webhook/omise/` | Omise webhook (placeholder) |

### Admin (Token Required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/token/` | Obtain admin token |
| GET | `/api/admin/orders/` | List all orders |
| PATCH | `/api/admin/orders/<id>/update-status/` | Update order status |
| GET | `/api/admin/stats/` | Dashboard statistics |

---

## 🔒 Security Notes

- Admin endpoints protected with DRF Token Authentication
- Idempotency check on webhook to prevent double-processing
- `select_for_update()` used in webhook to prevent race conditions
- `TODO: HMAC-SHA256 webhook signature verification` before production use

---

## 👨‍💻 Author

**Peerapong Thongnuch (ภีระพงศ์ ทองนุช)**
GitHub: [@POTAE31121](https://github.com/POTAE31121)

---

*Built with ❤️ as a portfolio project — designed with production-grade engineering principles.*
